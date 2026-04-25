/**
 * ElectroAR — Ruta /api/suscripciones
 * Maneja suscripciones recurrentes con MercadoPago
 */

import { Router } from 'express'
import { MercadoPagoConfig, PreApprovalPlan, PreApproval } from 'mercadopago'
import { PrismaClient } from '@prisma/client'

const router  = Router()
const prisma  = new PrismaClient()
const client  = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
})

const PLAN_MONTO  = 20000
const PLAN_NOMBRE = 'ElectroAR — Plan PRO'
const BACK_URL    = process.env.FRONTEND_URL || 'http://localhost:5173'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/suscripciones/crear
// Crea una suscripción para un electricista y retorna la URL de pago de MP
// ─────────────────────────────────────────────────────────────────────────────
router.post('/crear', async (req, res) => {
  try {
    const { electricistaId, email, nombre } = req.body

    if (!electricistaId || !email || !nombre) {
      return res.status(400).json({ error: 'Faltan datos del electricista' })
    }

    // Verificar que el electricista existe
    const electricista = await prisma.electricista.findUnique({
      where: { id: parseInt(electricistaId) },
    })
    if (!electricista) {
      return res.status(404).json({ error: 'Electricista no encontrado' })
    }

    // Crear suscripción en MercadoPago
    const preApproval = new PreApproval(client)
    const suscripcion = await preApproval.create({
      body: {
        reason:           PLAN_NOMBRE,
        payer_email:      email,
        back_url:         `${BACK_URL}/registro?estado=aprobado`,
        auto_recurring: {
          frequency:       1,
          frequency_type: 'months',
          transaction_amount: PLAN_MONTO,
          currency_id:    'ARS',
        },
        external_reference: String(electricistaId),
      },
    })

    return res.json({
      ok:       true,
      init_point: suscripcion.init_point, // URL donde el electricista paga
      id:       suscripcion.id,
    })

  } catch (error) {
    console.error('[Suscripciones] Error al crear:', error.message)
    return res.status(500).json({ error: 'Error al crear suscripción', detalle: error.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/suscripciones/webhook
// MercadoPago avisa cuando se procesa un pago
// ─────────────────────────────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body

    console.log('[Webhook MP] Evento recibido:', type, data?.id)

    if (type === 'subscription_preapproval') {
      const preApproval  = new PreApproval(client)
      const suscripcion  = await preApproval.get({ id: data.id })

      const electricistaId = parseInt(suscripcion.external_reference)
      const estado         = suscripcion.status // 'authorized', 'paused', 'cancelled'

      if (estado === 'authorized') {
        // Activar Plan PRO
        await prisma.electricista.update({
          where: { id: electricistaId },
          data:  { plan: 'pro', verificado: true },
        })

        // Registrar pago
        await prisma.pago.create({
          data: {
            electricistaId,
            monto:       PLAN_MONTO,
            estado:      'aprobado',
            mpPaymentId: data.id,
          },
        })

        console.log(`[Webhook MP] ✅ Plan PRO activado para electricista ${electricistaId}`)

      } else if (estado === 'cancelled') {
        // Bajar a plan free si cancela
        await prisma.electricista.update({
          where: { id: electricistaId },
          data:  { plan: 'free', verificado: false },
        })
        console.log(`[Webhook MP] ⚠️ Suscripción cancelada para electricista ${electricistaId}`)
      }
    }

    return res.sendStatus(200)

  } catch (error) {
    console.error('[Webhook MP] Error:', error.message)
    return res.sendStatus(500)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/suscripciones/estado/:electricistaId
// Ver el estado actual del plan de un electricista
// ─────────────────────────────────────────────────────────────────────────────
router.get('/estado/:electricistaId', async (req, res) => {
  try {
    const electricista = await prisma.electricista.findUnique({
      where: { id: parseInt(req.params.electricistaId) },
      select: { plan: true, verificado: true },
    })
    if (!electricista) return res.status(404).json({ error: 'No encontrado' })
    return res.json(electricista)
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener estado' })
  }
})

export default router