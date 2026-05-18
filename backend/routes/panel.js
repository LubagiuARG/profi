import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'
import { enviarEmail } from '../services/email.js'
import { generarTokenResena } from '../services/otp.js'

const router = Router()
const prisma = new PrismaClient()

// Todas las rutas del panel requieren autenticación
router.use(authMiddleware)

// GET /api/panel/stats — Estadísticas del perfil
router.get('/stats', async (req, res) => {
  try {
    const profesional = await prisma.profesional.findUnique({
      where: { id: req.profesionalId },
      select: {
        visitas: true, rating: true, reviews: true,
        plan: true, verificado: true, vacaciones: true,
        creadoEn: true,
        solicitudesUsadasMes: true,
        solicitudesResetEn:   true,
      },
    })

    // Lazy reset: si el período ya pasó, el contador efectivo es 0
    const ahora = new Date()
    const expirado = profesional?.solicitudesResetEn && profesional.solicitudesResetEn < ahora
    return res.json({
      ...profesional,
      solicitudesUsadasMes: expirado ? 0 : profesional.solicitudesUsadasMes,
      solicitudesLimiteFree: 3,
    })
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

// PATCH /api/panel/perfil — Editar perfil
router.patch('/perfil', async (req, res) => {
  try {
    const {
      nombre, apellido, telefono, matricula,
      provincia, zona, descripcion, especialidades,
    } = req.body

    const actualizado = await prisma.profesional.update({
      where: { id: req.profesionalId },
      data: {
        ...(nombre         && { nombre }),
        ...(apellido       && { apellido }),
        ...(telefono       && { telefono }),
        ...(matricula      && { matricula }),
        ...(provincia      && { provincia }),
        ...(zona           && { zona }),
        ...(descripcion    && { descripcion }),
        ...(especialidades && { especialidades }),
      },
    })

    return res.json({ ok: true, profesional: actualizado })
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar perfil' })
  }
})

// PATCH /api/panel/vacaciones — Activar/desactivar modo vacaciones
router.patch('/vacaciones', async (req, res) => {
  try {
    const { vacaciones } = req.body
    await prisma.profesional.update({
      where: { id: req.profesionalId },
      data:  { vacaciones },
    })
    return res.json({ ok: true, vacaciones })
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar modo vacaciones' })
  }
})

// DELETE /api/panel/cuenta — Darse de baja
router.delete('/cuenta', async (req, res) => {
  try {
    await prisma.profesional.update({
      where: { id: req.profesionalId },
      data:  { activo: false },
    })
    return res.json({ ok: true, mensaje: 'Cuenta desactivada correctamente' })
  } catch (error) {
    return res.status(500).json({ error: 'Error al desactivar cuenta' })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Solicitudes del profesional (lead matching)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/panel/solicitudes — lista del pro autenticado
router.get('/solicitudes', async (req, res) => {
  try {
    // Marca como 'expirada' las pendientes vencidas (patch perezoso)
    await prisma.solicitud.updateMany({
      where: {
        profesionalId: req.profesionalId,
        estado: 'pendiente',
        expiraEn: { lt: new Date() },
      },
      data: { estado: 'expirada' },
    })

    const solicitudes = await prisma.solicitud.findMany({
      where: { profesionalId: req.profesionalId },
      include: {
        categoria: { select: { nombre: true, emoji: true, slug: true } },
        cliente:   { select: { identidadVerificada: true } },
      },
      orderBy: [
        // pendientes primero, después por fecha
        { estado: 'asc' },
        { creadoEn: 'desc' },
      ],
    })

    return res.json(solicitudes)
  } catch (error) {
    console.error('[Panel] Error listar solicitudes:', error.message)
    return res.status(500).json({ error: 'Error al obtener solicitudes' })
  }
})

async function buscarSolicitudPropia(id, profesionalId) {
  return prisma.solicitud.findFirst({
    where: { id: Number(id), profesionalId },
  })
}

// PATCH /api/panel/solicitudes/:id/aceptar
router.patch('/solicitudes/:id/aceptar', async (req, res) => {
  try {
    const sol = await buscarSolicitudPropia(req.params.id, req.profesionalId)
    if (!sol) return res.status(404).json({ error: 'Solicitud no encontrada' })
    if (sol.estado !== 'pendiente') {
      return res.status(409).json({ error: `La solicitud ya está ${sol.estado}` })
    }
    if (sol.expiraEn < new Date()) {
      await prisma.solicitud.update({
        where: { id: sol.id },
        data:  { estado: 'expirada' },
      })
      return res.status(410).json({ error: 'La solicitud expiró' })
    }

    const actualizada = await prisma.solicitud.update({
      where: { id: sol.id },
      data:  { estado: 'aceptada', respondidoEn: new Date() },
    })

    const pro = await prisma.profesional.findUnique({
      where:  { id: req.profesionalId },
      select: { nombre: true, apellido: true, telefono: true, email: true, zona: true },
    })

    enviarEmail(sol.clienteEmail, 'solicitud-aceptada', {
      clienteNombre: sol.clienteNombre,
      proNombre:    `${pro.nombre} ${pro.apellido}`,
      proTelefono:  pro.telefono,
      proZona:      pro.zona,
      waLink:       `https://wa.me/${(pro.telefono || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${pro.nombre}, vengo de TuProfesional`)}`,
    })

    return res.json({ ok: true, solicitud: actualizada })
  } catch (error) {
    console.error('[Panel] Error aceptar solicitud:', error.message)
    return res.status(500).json({ error: 'Error al aceptar solicitud' })
  }
})

// PATCH /api/panel/solicitudes/:id/rechazar
router.patch('/solicitudes/:id/rechazar', async (req, res) => {
  try {
    const { motivo } = req.body
    const sol = await buscarSolicitudPropia(req.params.id, req.profesionalId)
    if (!sol) return res.status(404).json({ error: 'Solicitud no encontrada' })
    if (sol.estado !== 'pendiente') {
      return res.status(409).json({ error: `La solicitud ya está ${sol.estado}` })
    }

    const actualizada = await prisma.solicitud.update({
      where: { id: sol.id },
      data:  {
        estado: 'rechazada',
        motivoRechazo: motivo?.slice(0, 500) || null,
        respondidoEn: new Date(),
      },
    })

    enviarEmail(sol.clienteEmail, 'solicitud-rechazada', {
      clienteNombre: sol.clienteNombre,
      motivo: motivo || 'Sin motivo especificado',
    })

    return res.json({ ok: true, solicitud: actualizada })
  } catch (error) {
    console.error('[Panel] Error rechazar solicitud:', error.message)
    return res.status(500).json({ error: 'Error al rechazar solicitud' })
  }
})

// PATCH /api/panel/solicitudes/:id/cerrar — el pro marca el trabajo como terminado
router.patch('/solicitudes/:id/cerrar', async (req, res) => {
  try {
    const sol = await buscarSolicitudPropia(req.params.id, req.profesionalId)
    if (!sol) return res.status(404).json({ error: 'Solicitud no encontrada' })
    if (sol.estado !== 'aceptada') {
      return res.status(409).json({ error: `Solo se pueden cerrar solicitudes aceptadas (esta está ${sol.estado})` })
    }

    const actualizada = await prisma.solicitud.update({
      where: { id: sol.id },
      data:  { estado: 'cerrada', cerradoEn: new Date() },
    })

    // Token de reseña — sirve para que el cliente puntúe sin password
    const tokenResena = generarTokenResena({
      solicitudId:   sol.id,
      profesionalId: req.profesionalId,
    })
    const linkResena = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resena/${tokenResena}`

    const pro = await prisma.profesional.findUnique({
      where:  { id: req.profesionalId },
      select: { nombre: true, apellido: true },
    })

    enviarEmail(sol.clienteEmail, 'solicitud-cerrada', {
      clienteNombre: sol.clienteNombre,
      proNombre:    `${pro.nombre} ${pro.apellido}`,
      linkResena,
    })

    return res.json({ ok: true, solicitud: actualizada })
  } catch (error) {
    console.error('[Panel] Error cerrar solicitud:', error.message)
    return res.status(500).json({ error: 'Error al cerrar solicitud' })
  }
})

export default router