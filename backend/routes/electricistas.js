/**
 * ElectroAR — Ruta /api/electricistas
 * CRUD de electricistas con Prisma + PostgreSQL
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /api/electricistas — Listar todos los activos
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

    const electricistas = await prisma.electricista.findMany({
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

    return res.json(electricistas)
  } catch (error) {
    console.error('[Electricistas] Error al listar:', error.message)
    return res.status(500).json({ error: 'Error al obtener electricistas' })
  }
})

// GET /api/electricistas/:id — Ver uno
router.get('/:id', async (req, res) => {
  try {
    const electricista = await prisma.electricista.findUnique({
      where: { id: parseInt(req.params.id) },
    })
    if (!electricista) return res.status(404).json({ error: 'No encontrado' })
    return res.json(electricista)
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener electricista' })
  }
})

// POST /api/electricistas — Registrar nuevo
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
    const existe = await prisma.electricista.findUnique({ where: { email } })
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un electricista con ese email' })
    }

    const electricista = await prisma.electricista.create({
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
      mensaje: 'Electricista registrado correctamente',
      id: electricista.id,
    })
  } catch (error) {
    console.error('[Electricistas] Error al registrar:', error.message)
    return res.status(500).json({ error: 'Error al registrar electricista' })
  }
})

// PATCH /api/electricistas/:id/plan — Actualizar plan (lo llama MercadoPago webhook)
router.patch('/:id/plan', async (req, res) => {
  try {
    const { plan, mpPaymentId } = req.body

    const electricista = await prisma.electricista.update({
      where: { id: parseInt(req.params.id) },
      data:  { plan, verificado: plan === 'pro' },
    })

    // Registrar el pago
    if (mpPaymentId) {
      await prisma.pago.create({
        data: {
          electricistaId: electricista.id,
          monto:          8900,
          estado:         'aprobado',
          mpPaymentId,
        },
      })
    }

    return res.json({ ok: true, plan: electricista.plan })
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar plan' })
  }
})

export default router