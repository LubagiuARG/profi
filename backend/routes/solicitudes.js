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

const EXPIRACION_DIAS  = 7
const MAX_PROS_PEDIDO  = 3
const SUGERENCIAS_TOP  = 6

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
      select: { id: true, nombre: true, email: true, telefono: true },
    })
    if (!profesionalesValidos.length) {
      return res.status(400).json({ error: 'Ninguno de los profesionales seleccionados está disponible' })
    }

    const expiraEn = new Date(Date.now() + EXPIRACION_DIAS * 24 * 60 * 60 * 1000)

    const solicitudes = await prisma.$transaction(
      profesionalesValidos.map(pro =>
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
            expiraEn,
          },
        })
      )
    )

    // Email a cada pro (mock en dev)
    for (const pro of profesionalesValidos) {
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

    return res.status(201).json({
      ok: true,
      solicitudes: solicitudes.map(s => ({ id: s.id, profesionalId: s.profesionalId })),
      expiraEn,
    })
  } catch (error) {
    console.error('[Solicitudes] Error crear:', error.message)
    return res.status(500).json({ error: 'Error al crear solicitud' })
  }
})

export default router
