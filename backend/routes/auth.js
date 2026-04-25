import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { generarToken } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const {
      nombre, apellido, email, password,
      telefono, matricula, provincia, zona,
      descripcion, especialidades, plan,
    } = req.body

    if (!nombre || !apellido || !email || !password || !telefono || !provincia || !zona) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }

    const existe = await prisma.electricista.findUnique({ where: { email } })
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un profesional con ese email' })
    }

    const hash = await bcrypt.hash(password, 10)

    const electricista = await prisma.electricista.create({
      data: {
        nombre, apellido, email,
        password:       hash,
        telefono,
        matricula:      matricula    || null,
        provincia,
        zona,
        descripcion:    descripcion  || null,
        especialidades: especialidades || [],
        plan:           plan         || 'free',
      },
    })

    const token = generarToken(electricista.id)

    return res.status(201).json({
      ok: true,
      token,
      electricista: {
        id:       electricista.id,
        nombre:   electricista.nombre,
        apellido: electricista.apellido,
        email:    electricista.email,
        plan:     electricista.plan,
      },
    })
  } catch (error) {
    console.error('[Auth] Error registro:', error.message)
    return res.status(500).json({ error: 'Error al registrar' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' })
    }

    const electricista = await prisma.electricista.findUnique({ where: { email } })
    if (!electricista || !electricista.password) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    const valido = await bcrypt.compare(password, electricista.password)
    if (!valido) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    const token = generarToken(electricista.id)

    return res.json({
      ok: true,
      token,
      electricista: {
        id:        electricista.id,
        nombre:    electricista.nombre,
        apellido:  electricista.apellido,
        email:     electricista.email,
        plan:      electricista.plan,
        vacaciones:electricista.vacaciones,
        verificado:electricista.verificado,
      },
    })
  } catch (error) {
    console.error('[Auth] Error login:', error.message)
    return res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

// GET /api/auth/me — Ver perfil propio
router.get('/me', async (req, res) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }
  try {
    const jwt = await import('jsonwebtoken')
    const payload = jwt.default.verify(
      header.split(' ')[1],
      process.env.JWT_SECRET || 'electro-ar-secret-key'
    )
    const electricista = await prisma.electricista.findUnique({
      where: { id: payload.id },
      select: {
        id: true, nombre: true, apellido: true, email: true,
        telefono: true, matricula: true, provincia: true,
        zona: true, descripcion: true, especialidades: true,
        plan: true, verificado: true, vacaciones: true,
        activo: true, rating: true, reviews: true, visitas: true,
        creadoEn: true,
      },
    })
    if (!electricista) return res.status(404).json({ error: 'No encontrado' })
    return res.json(electricista)
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
})

export default router