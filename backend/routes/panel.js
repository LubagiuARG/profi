import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

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
      },
    })
    return res.json(profesional)
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

export default router