/**
 * TuProfesional — Ruta /api/suscripciones
 * Maneja suscripciones recurrentes con MercadoPago
 */

import { Router } from 'express'
import crypto from 'crypto'
import { MercadoPagoConfig, PreApprovalPlan, PreApproval } from 'mercadopago'
import { PrismaClient } from '@prisma/client'

const router  = Router()
const prisma  = new PrismaClient()
const client  = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
})

const PLAN_MONTO  = 20000
const PLAN_NOMBRE = 'TuProfesional — Plan PRO'
const BACK_URL    = process.env.FRONTEND_URL || 'http://localhost:5173'

// ─────────────────────────────────────────────────────────────────────────────
// Verificación de firma del webhook MP (BE-001)
// MP firma: HMAC-SHA256(secret, `id:${data.id};request-id:${xRequestId};ts:${ts};`)
// Headers: x-signature (formato `ts=...,v1=...`) y x-request-id.
// Docs: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
// ─────────────────────────────────────────────────────────────────────────────
function verificarFirmaMP(req) {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    // En prod: no aceptar webhooks sin secret configurado. En dev: dejar pasar con warning.
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, motivo: 'MP_WEBHOOK_SECRET no configurado' }
    }
    console.warn('[Webhook MP] ⚠️ MP_WEBHOOK_SECRET no configurado — validación de firma saltada (solo permitido en dev)')
    return { ok: true, saltado: true }
  }

  const firma     = req.headers['x-signature']
  const requestId = req.headers['x-request-id']
  const dataId    = req.body?.data?.id

  if (!firma || !requestId || !dataId) {
    return { ok: false, motivo: 'Headers o data.id faltantes' }
  }

  const partes = Object.fromEntries(
    firma.split(',').map(p => p.split('=').map(s => s.trim()))
  )
  const ts = partes.ts
  const v1 = partes.v1
  if (!ts || !v1) return { ok: false, motivo: 'x-signature mal formada' }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const esperado = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  const ok = v1.length === esperado.length &&
             crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(esperado))
  return ok ? { ok: true } : { ok: false, motivo: 'Firma inválida' }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/suscripciones/crear
// Crea una suscripción para un profesional y retorna la URL de pago de MP
// ─────────────────────────────────────────────────────────────────────────────
router.post('/crear', async (req, res) => {
  try {
    const { profesionalId, email, nombre } = req.body

    if (!profesionalId || !email || !nombre) {
      return res.status(400).json({ error: 'Faltan datos del profesional' })
    }

    // Verificar que el profesional existe
    const profesional = await prisma.profesional.findUnique({
      where: { id: parseInt(profesionalId) },
    })
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' })
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
        external_reference: String(profesionalId),
      },
    })

    return res.json({
      ok:       true,
      init_point: suscripcion.init_point, // URL donde el profesional paga
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
    const verificacion = verificarFirmaMP(req)
    if (!verificacion.ok) {
      console.warn(`[Webhook MP] ❌ Firma rechazada: ${verificacion.motivo}`)
      return res.sendStatus(401)
    }

    const { type, data } = req.body

    console.log('[Webhook MP] Evento recibido:', type, data?.id)

    if (type === 'subscription_preapproval') {
      const preApproval  = new PreApproval(client)
      const suscripcion  = await preApproval.get({ id: data.id })

      const profesionalId = parseInt(suscripcion.external_reference)
      const estado         = suscripcion.status // 'authorized', 'paused', 'cancelled'

      if (estado === 'authorized') {
        // Activar Plan PRO
        await prisma.profesional.update({
          where: { id: profesionalId },
          data:  { plan: 'pro', verificado: true },
        })

        // Registrar pago (BE-017: idempotente por mpPaymentId)
        const pagoExistente = await prisma.pago.findFirst({
          where: { mpPaymentId: String(data.id) },
        })
        if (pagoExistente) {
          console.log(`[Webhook MP] ↩️ Pago ${data.id} ya registrado, salteo creación`)
        } else {
          await prisma.pago.create({
            data: {
              profesionalId,
              monto:       PLAN_MONTO,
              estado:      'aprobado',
              mpPaymentId: String(data.id),
            },
          })
        }

        console.log(`[Webhook MP] ✅ Plan PRO activado para profesional ${profesionalId}`)

      } else if (estado === 'cancelled') {
        // Bajar a plan free si cancela
        await prisma.profesional.update({
          where: { id: profesionalId },
          data:  { plan: 'free', verificado: false },
        })
        console.log(`[Webhook MP] ⚠️ Suscripción cancelada para profesional ${profesionalId}`)
      }
    }

    return res.sendStatus(200)

  } catch (error) {
    console.error('[Webhook MP] Error:', error.message)
    return res.sendStatus(500)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/suscripciones/estado/:profesionalId
// Ver el estado actual del plan de un profesional
// ─────────────────────────────────────────────────────────────────────────────
router.get('/estado/:profesionalId', async (req, res) => {
  try {
    const profesional = await prisma.profesional.findUnique({
      where: { id: parseInt(req.params.profesionalId) },
      select: { plan: true, verificado: true },
    })
    if (!profesional) return res.status(404).json({ error: 'No encontrado' })
    return res.json(profesional)
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener estado' })
  }
})

export default router