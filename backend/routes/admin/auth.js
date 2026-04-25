import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { adminAuthMiddleware, generarTokenAdmin } from '../../middleware/adminAuth.js'

const router = Router()
const prisma = new PrismaClient()

// POST /api/admin/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' })
    }

    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin || !admin.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const ok = await bcrypt.compare(password, admin.password)
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data:  { ultimoLogin: new Date() },
    })

    const token = generarTokenAdmin(admin.id, admin.rol)
    return res.json({
      token,
      admin: { id: admin.id, nombre: admin.nombre, email: admin.email, rol: admin.rol },
    })
  } catch (error) {
    console.error('[Admin/Auth] Error login:', error.message)
    return res.status(500).json({ error: 'Error interno' })
  }
})

// GET /api/admin/auth/me
router.get('/me', adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where:  { id: req.adminId },
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true, ultimoLogin: true },
    })
    if (!admin) return res.status(404).json({ error: 'Admin no encontrado' })
    return res.json(admin)
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' })
  }
})

export default router
