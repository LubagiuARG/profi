/**
 * ElectroAR — Ruta /api/profesionales
 * CRUD de profesionales con Prisma + PostgreSQL
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /api/profesionales — Listar todos los activos
router.get('/', async (req, res) => {
  try {
    const { zona, plan, search } = req.query

    const where = { activo: true }

    if (zona) {
      where.zona = { contains: zona, mode: 'insensitive' }
    }

    if (plan) {
      where.plan = plan
    }

    if (search) {
      where.OR = [
        { nombre:   { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { zona:     { contains: search, mode: 'insensitive' } },
      ]
    }

    const profesionales = await prisma.profesional.findMany({
      where,
      orderBy: [
        { plan: 'desc' },    // PRO primero
        { rating: 'desc' },  // luego por rating
      ],
      select: {
        id:            true,
        nombre:        true,
        apellido:      true,
        telefono:      true,
        matricula:     true,
        provincia:     true,
        zona:          true,
        localidad:     true,
        localidadId:   true,
        radioKm:       true,
        descripcion:   true,
        especialidades:true,
        plan:          true,
        verificado:    true,
        rating:        true,
        reviews:       true,
      },
    })

    return res.json(profesionales)
  } catch (error) {
    console.error('[Profesionales] Error al listar:', error.message)
    return res.status(500).json({ error: 'Error al obtener profesionales' })
  }
})

// GET /api/profesionales/:id — Ver uno
router.get('/:id', async (req, res) => {
  try {
    const profesional = await prisma.profesional.findUnique({
      where: { id: parseInt(req.params.id) },
    })
    if (!profesional) return res.status(404).json({ error: 'No encontrado' })
    return res.json(profesional)
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener profesional' })
  }
})

// POST /api/profesionales — Registrar nuevo
router.post('/', async (req, res) => {
  try {
    const {
      nombre, apellido, email, telefono,
      matricula, provincia, zona, descripcion,
      especialidades, plan,
      localidad, localidadId, radioKm,
    } = req.body

    // Validar campos obligatorios
    if (!nombre || !apellido || !email || !telefono || !provincia || !zona) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }

    // Verificar que el email no exista
    const existe = await prisma.profesional.findUnique({ where: { email } })
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un profesional con ese email' })
    }

    const profesional = await prisma.profesional.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        matricula:      matricula     || null,
        provincia,
        zona,
        descripcion:    descripcion   || null,
        especialidades: especialidades || [],
        plan:           plan          || 'free',
        localidad:      localidad     || null,
        localidadId:    localidadId   || null,
        radioKm:        radioKm       ?? 20,
      },
    })

    return res.status(201).json({
      ok: true,
      mensaje: 'Profesional registrado correctamente',
      id: profesional.id,
    })
  } catch (error) {
    console.error('[Profesionales] Error al registrar:', error.message)
    return res.status(500).json({ error: 'Error al registrar profesional' })
  }
})

// PATCH /api/profesionales/:id/plan — Actualizar plan (lo llama MercadoPago webhook)
router.patch('/:id/plan', async (req, res) => {
  try {
    const { plan, mpPaymentId } = req.body

    const profesional = await prisma.profesional.update({
      where: { id: parseInt(req.params.id) },
      data:  { plan, verificado: plan === 'pro' },
    })

    // Registrar el pago
    if (mpPaymentId) {
      await prisma.pago.create({
        data: {
          profesionalId: profesional.id,
          monto:          8900,
          estado:         'aprobado',
          mpPaymentId,
        },
      })
    }

    return res.json({ ok: true, plan: profesional.plan })
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar plan' })
  }
})

export default router