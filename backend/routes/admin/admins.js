import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { superAdminMiddleware } from '../../middleware/adminAuth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(superAdminMiddleware)

// GET /api/admin/admins — listar
router.get('/', async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true, ultimoLogin: true },
      orderBy: { creadoEn: 'asc' },
    })
    return res.json(admins)
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener admins' })
  }
})

// POST /api/admin/admins — crear nuevo
router.post('/', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password son obligatorios' })
    }

    const existe = await prisma.admin.findUnique({ where: { email } })
    if (existe) return res.status(409).json({ error: 'Ya existe un admin con ese email' })

    const hash  = await bcrypt.hash(password, 10)
    const admin = await prisma.admin.create({
      data: { nombre, email, password: hash, rol: rol || 'admin' },
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true },
    })
    return res.status(201).json(admin)
  } catch (error) {
    console.error('[Admin/Admins] Error crear:', error.message)
    return res.status(500).json({ error: 'Error al crear admin' })
  }
})

// PATCH /api/admin/admins/:id — activar/desactivar, cambiar password
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { activo, password } = req.body

    const data = {}
    if (activo   !== undefined) data.activo   = activo
    if (password !== undefined) data.password = await bcrypt.hash(password, 10)

    const admin = await prisma.admin.update({
      where: { id },
      data,
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    })
    return res.json(admin)
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Admin no encontrado' })
    return res.status(500).json({ error: 'Error al actualizar admin' })
  }
})

// DELETE /api/admin/admins/:id — eliminar (no puede eliminarse a sí mismo)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (id === req.adminId) {
      return res.status(400).json({ error: 'No podés eliminarte a vos mismo' })
    }

    await prisma.admin.delete({ where: { id } })
    return res.json({ ok: true })
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Admin no encontrado' })
    return res.status(500).json({ error: 'Error al eliminar admin' })
  }
})

export default router
