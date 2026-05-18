/**
 * TuProfesional — Ruta /api/resenas
 * Reseñas del cliente al profesional, accesibles por token JWT (sin password).
 * El token se genera al cerrar la solicitud — TTL 30 días, link enviado por email.
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { verificarTokenResena } from '../services/otp.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/resenas/:token/info — datos para mostrar el form (sin reseñar todavía)
router.get('/:token/info', async (req, res) => {
  try {
    const payload = verificarTokenResena(req.params.token)
    if (!payload) return res.status(401).json({ error: 'Link inválido o expirado' })

    const solicitud = await prisma.solicitud.findFirst({
      where: { id: payload.solicitudId, profesionalId: payload.profesionalId },
      include: {
        profesional: { select: { nombre: true, apellido: true } },
        categoria:   { select: { nombre: true, emoji: true } },
      },
    })
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' })
    if (solicitud.estado !== 'cerrada') {
      return res.status(409).json({ error: `Solo se pueden reseñar trabajos terminados (estado actual: ${solicitud.estado})` })
    }

    const yaExiste = await prisma.resena.findUnique({
      where: { solicitudId: solicitud.id },
    })

    return res.json({
      profesional:   solicitud.profesional,
      categoria:     solicitud.categoria,
      clienteNombre: solicitud.clienteNombre,
      yaReseñada:    Boolean(yaExiste),
    })
  } catch (error) {
    console.error('[Resenas] Error info:', error.message)
    return res.status(500).json({ error: 'Error al obtener info de la reseña' })
  }
})

// POST /api/resenas/:token — crear la reseña
router.post('/:token', async (req, res) => {
  try {
    const payload = verificarTokenResena(req.params.token)
    if (!payload) return res.status(401).json({ error: 'Link inválido o expirado' })

    const { rating, comentario } = req.body
    const ratingNum = Number(rating)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating debe ser un entero entre 1 y 5' })
    }

    const solicitud = await prisma.solicitud.findFirst({
      where: { id: payload.solicitudId, profesionalId: payload.profesionalId },
    })
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' })
    if (solicitud.estado !== 'cerrada') {
      return res.status(409).json({ error: 'Solo se pueden reseñar trabajos terminados' })
    }

    const yaExiste = await prisma.resena.findUnique({
      where: { solicitudId: solicitud.id },
    })
    if (yaExiste) {
      return res.status(409).json({ error: 'Ya enviaste una reseña para este trabajo' })
    }

    await prisma.resena.create({
      data: {
        profesionalId: payload.profesionalId,
        solicitudId:   solicitud.id,
        autor:         solicitud.clienteNombre,
        rating:        ratingNum,
        comentario:    comentario?.slice(0, 1000) || null,
      },
    })

    // Recalcular rating y reviews del profesional
    const agg = await prisma.resena.aggregate({
      where:  { profesionalId: payload.profesionalId },
      _avg:   { rating: true },
      _count: { id: true },
    })
    await prisma.profesional.update({
      where: { id: payload.profesionalId },
      data:  {
        rating:  Number((agg._avg.rating || 0).toFixed(2)),
        reviews: agg._count.id,
      },
    })

    return res.status(201).json({ ok: true })
  } catch (error) {
    console.error('[Resenas] Error crear:', error.message)
    return res.status(500).json({ error: 'Error al guardar la reseña' })
  }
})

export default router
