/**
 * TuProfesional — Ruta /api/solicitudes
 * Lead matching: el cliente conecta con profesionales tras un presupuesto IA.
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { verificarTokenCliente } from '../services/otp.js'
import { enviarEmail } from '../services/email.js'

const router = Router()
const prisma = new PrismaClient()

const EXPIRACION_DIAS    = 7
const MAX_PROS_PEDIDO    = 3
const SUGERENCIAS_TOP    = 6
const LEADS_FREE_POR_MES = 3

// Primer día del mes siguiente a la fecha actual
function proximoReset() {
  const ahora = new Date()
  return new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)
}

// POST /api/solicitudes/sugerencias
// Devuelve top N profesionales para un presupuesto + ubicación.
// Orden: PRO → verificado → rating → reviews
router.post('/sugerencias', async (req, res) => {
  try {
    const { categoriaSlug, ubicacion } = req.body
    if (!categoriaSlug) return res.status(400).json({ error: 'categoriaSlug requerido' })

    const categoria = await prisma.categoria.findUnique({ where: { slug: categoriaSlug } })
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' })

    const where = {
      activo: true,
      vacaciones: false,
      categoriaId: categoria.id,
    }
    if (ubicacion?.provincia) {
      where.provincia = { equals: ubicacion.provincia, mode: 'insensitive' }
    }

    const profesionales = await prisma.profesional.findMany({
      where,
      orderBy: [
        { plan: 'desc' },        // pro > free
        { verificado: 'desc' },
        { rating: 'desc' },
        { reviews: 'desc' },
      ],
      take: SUGERENCIAS_TOP,
      select: {
        id: true, nombre: true, apellido: true,
        provincia: true, zona: true, localidad: true,
        descripcion: true, especialidades: true,
        plan: true, verificado: true,
        rating: true, reviews: true,
      },
    })

    return res.json({ categoria: categoria.nombre, profesionales })
  } catch (error) {
    console.error('[Solicitudes] Error sugerencias:', error.message)
    return res.status(500).json({ error: 'Error al obtener sugerencias' })
  }
})

// POST /api/solicitudes
// Crea una solicitud por cada profesional elegido (hasta 3).
// Requiere tokenCliente (de verificar OTP, TTL 30 min).
router.post('/', async (req, res) => {
  try {
    const {
      tokenCliente,
      nombre, email,
      categoriaSlug,
      profesionalIds,
      presupuestoSnapshot,
      mensajeExtra,
      ubicacion,
    } = req.body

    if (!tokenCliente) return res.status(401).json({ error: 'Falta tokenCliente (verificá OTP primero)' })
    const payload = verificarTokenCliente(tokenCliente)
    if (!payload) return res.status(401).json({ error: 'tokenCliente inválido o expirado' })
    const telefono = payload.telefono

    if (!nombre) return res.status(400).json({ error: 'Nombre del cliente requerido' })
    if (!categoriaSlug) return res.status(400).json({ error: 'categoriaSlug requerido' })
    if (!Array.isArray(profesionalIds) || !profesionalIds.length) {
      return res.status(400).json({ error: 'Elegí al menos un profesional' })
    }
    if (profesionalIds.length > MAX_PROS_PEDIDO) {
      return res.status(400).json({ error: `Máximo ${MAX_PROS_PEDIDO} profesionales por solicitud` })
    }
    if (!presupuestoSnapshot || typeof presupuestoSnapshot !== 'object') {
      return res.status(400).json({ error: 'presupuestoSnapshot requerido' })
    }

    const categoria = await prisma.categoria.findUnique({ where: { slug: categoriaSlug } })
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' })

    // Upsert cliente por teléfono (PK lógica)
    const cliente = await prisma.cliente.upsert({
      where:  { telefono },
      update: { nombre, email: email || undefined },
      create: { telefono, nombre, email: email || null },
    })

    const profesionalesValidos = await prisma.profesional.findMany({
      where: { id: { in: profesionalIds.map(Number) }, activo: true },
      select: {
        id: true, nombre: true, email: true, telefono: true,
        plan: true, solicitudesUsadasMes: true, solicitudesResetEn: true,
      },
    })
    if (!profesionalesValidos.length) {
      return res.status(400).json({ error: 'Ninguno de los profesionales seleccionados está disponible' })
    }

    // Lazy reset del contador mensual + decidir qué solicitudes van a cola (BE-048)
    const ahora = new Date()
    const reset = proximoReset()
    const decisiones = profesionalesValidos.map(pro => {
      const usadas = pro.solicitudesResetEn && pro.solicitudesResetEn < ahora ? 0 : pro.solicitudesUsadasMes
      const enCola = pro.plan === 'free' && usadas >= LEADS_FREE_POR_MES
      return { pro, usadas, enCola }
    })

    const expiraEn = new Date(Date.now() + EXPIRACION_DIAS * 24 * 60 * 60 * 1000)

    const operaciones = decisiones.map(({ pro, enCola }) =>
      prisma.solicitud.create({
        data: {
          clienteId:           cliente.id,
          clienteNombre:       nombre,
          clienteTelefono:     telefono,
          clienteEmail:        email || null,
          profesionalId:       pro.id,
          categoriaId:         categoria.id,
          presupuestoSnapshot,
          mensajeExtra:        mensajeExtra || null,
          ubicacion:           ubicacion || null,
          estado:              enCola ? 'pendiente_cola' : 'pendiente',
          expiraEn,
        },
      })
    )

    // Updates al contador del profesional (solo para los que NO van a cola)
    for (const { pro, usadas, enCola } of decisiones) {
      if (enCola) continue
      operaciones.push(prisma.profesional.update({
        where: { id: pro.id },
        data:  {
          solicitudesUsadasMes: usadas + 1,
          solicitudesResetEn:   pro.solicitudesResetEn && pro.solicitudesResetEn > ahora
            ? pro.solicitudesResetEn
            : reset,
        },
      }))
    }

    const resultado = await prisma.$transaction(operaciones)
    const solicitudes = resultado.filter(r => 'estado' in r) // las creaciones

    // Email solo a los pros que NO quedaron en cola
    for (const { pro, enCola } of decisiones) {
      if (enCola) continue
      enviarEmail(pro.email, 'solicitud-nueva', {
        proNombre: pro.nombre,
        clienteNombre: nombre,
        clienteTelefono: telefono,
        categoria: categoria.nombre,
        mensajeExtra: mensajeExtra || '(sin mensaje adicional)',
        totalPresupuesto: presupuestoSnapshot.total || '—',
        link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/panel`,
      })
    }

    const enviadas = decisiones.filter(d => !d.enCola).length
    const enColaCount = decisiones.length - enviadas

    return res.status(201).json({
      ok: true,
      solicitudes: solicitudes.map(s => ({ id: s.id, profesionalId: s.profesionalId, estado: s.estado })),
      expiraEn,
      resumen: { enviadas, enCola: enColaCount },
    })
  } catch (error) {
    console.error('[Solicitudes] Error crear:', error.message)
    return res.status(500).json({ error: 'Error al crear solicitud' })
  }
})

export default router
