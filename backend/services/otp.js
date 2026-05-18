/**
 * TuProfesional — Servicio de OTP para verificar teléfono del cliente.
 *
 * En dev: el código se loguea por consola (no hay SMS/WhatsApp real).
 * En prod: integrar Twilio o WhatsApp Cloud API. Punto de extensión: `enviarOtp`.
 *
 * Anti-spam:
 *  - 1 minuto de cooldown entre envíos al mismo teléfono.
 *  - Máximo 5 intentos de verificación por OTP antes de invalidarlo.
 *  - Expira a los 10 minutos.
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OTP_TTL_MIN          = 10
const OTP_COOLDOWN_SEG     = 60
const OTP_MAX_INTENTOS     = 5
const TOKEN_CLIENTE_TTL    = '30m'

function generarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function normalizarTelefono(tel) {
  // Saca todo lo que no sea dígito o +
  return String(tel || '').replace(/[^\d+]/g, '')
}

export async function enviarOtp(telefonoRaw) {
  const telefono = normalizarTelefono(telefonoRaw)
  if (!telefono || telefono.length < 8) {
    throw new Error('Teléfono inválido')
  }

  // Cooldown: si hay OTP activo de los últimos 60s, rechazar
  const reciente = await prisma.otpCliente.findFirst({
    where: {
      telefono,
      creadoEn: { gte: new Date(Date.now() - OTP_COOLDOWN_SEG * 1000) },
      verificadoEn: null,
    },
    orderBy: { creadoEn: 'desc' },
  })
  if (reciente) {
    const segundos = Math.ceil((reciente.creadoEn.getTime() + OTP_COOLDOWN_SEG * 1000 - Date.now()) / 1000)
    const err = new Error(`Esperá ${segundos}s antes de pedir otro código`)
    err.code = 'COOLDOWN'
    throw err
  }

  const codigo = generarCodigo()
  const codigoHash = await bcrypt.hash(codigo, 8)
  const expiraEn = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000)

  await prisma.otpCliente.create({
    data: { telefono, codigoHash, expiraEn },
  })

  // Envío real: en dev se loguea. En prod conectar Twilio/WA Cloud aquí.
  if (process.env.NODE_ENV === 'production' && process.env.WA_TOKEN) {
    // TODO: integrar WhatsApp Cloud API
    console.warn('[OTP] ⚠️ Integración WA Cloud no implementada todavía — código no enviado')
  } else {
    console.log(`[OTP DEV] 📱 Código ${codigo} para ${telefono} (expira en ${OTP_TTL_MIN} min)`)
  }

  return { ok: true, telefono, expiraEn }
}

export async function verificarOtp(telefonoRaw, codigo) {
  const telefono = normalizarTelefono(telefonoRaw)
  if (!telefono || !codigo) {
    throw new Error('Teléfono y código requeridos')
  }

  const otp = await prisma.otpCliente.findFirst({
    where: {
      telefono,
      verificadoEn: null,
      expiraEn: { gt: new Date() },
    },
    orderBy: { creadoEn: 'desc' },
  })

  if (!otp) {
    const err = new Error('No hay código activo. Pedí uno nuevo.')
    err.code = 'SIN_OTP'
    throw err
  }

  if (otp.intentos >= OTP_MAX_INTENTOS) {
    const err = new Error('Demasiados intentos. Pedí un código nuevo.')
    err.code = 'BLOQUEADO'
    throw err
  }

  const ok = await bcrypt.compare(String(codigo), otp.codigoHash)
  if (!ok) {
    await prisma.otpCliente.update({
      where: { id: otp.id },
      data:  { intentos: { increment: 1 } },
    })
    const err = new Error('Código incorrecto')
    err.code = 'CODIGO_INVALIDO'
    throw err
  }

  await prisma.otpCliente.update({
    where: { id: otp.id },
    data:  { verificadoEn: new Date() },
  })

  // Token corto que el cliente usa para crear la solicitud
  const tokenCliente = jwt.sign(
    { telefono, tipo: 'cliente_otp' },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_CLIENTE_TTL }
  )

  return { ok: true, telefono, tokenCliente }
}

export function verificarTokenCliente(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.tipo !== 'cliente_otp') return null
    return { telefono: payload.telefono }
  } catch {
    return null
  }
}
