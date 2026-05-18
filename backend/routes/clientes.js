/**
 * TuProfesional — Ruta /api/clientes
 * Verificación de teléfono del cliente vía OTP (sin password).
 */

import { Router } from 'express'
import { enviarOtp, verificarOtp } from '../services/otp.js'

const router = Router()

// POST /api/clientes/otp/enviar
router.post('/otp/enviar', async (req, res) => {
  try {
    const { telefono, email } = req.body
    if (!telefono) return res.status(400).json({ error: 'Teléfono requerido' })

    const result = await enviarOtp(telefono, email)
    return res.json(result)
  } catch (error) {
    const status = error.code === 'COOLDOWN' ? 429 : 400
    console.error('[Clientes] Error enviar OTP:', error.message)
    return res.status(status).json({ error: error.message })
  }
})

// POST /api/clientes/otp/verificar
router.post('/otp/verificar', async (req, res) => {
  try {
    const { telefono, codigo } = req.body
    if (!telefono || !codigo) {
      return res.status(400).json({ error: 'Teléfono y código requeridos' })
    }
    const result = await verificarOtp(telefono, codigo)
    return res.json(result)
  } catch (error) {
    const status =
      error.code === 'CODIGO_INVALIDO' ? 401 :
      error.code === 'BLOQUEADO'       ? 429 :
      error.code === 'SIN_OTP'         ? 410 : 400
    return res.status(status).json({ error: error.message })
  }
})

export default router
