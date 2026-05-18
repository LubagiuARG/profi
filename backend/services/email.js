/**
 * TuProfesional — Envío de emails transaccionales.
 *
 * Si SMTP_HOST/USER/PASS están seteados, se envía por SMTP (nodemailer).
 * Sino, se loguea por consola (modo mock).
 *
 * Templates conocidos:
 *  - 'solicitud-nueva'      al profesional cuando llega una solicitud
 *  - 'solicitud-aceptada'   al cliente cuando el pro acepta
 *  - 'solicitud-rechazada'  al cliente cuando el pro rechaza
 *  - 'solicitud-cerrada'    al cliente con link a /resena/:token
 *  - 'otp-codigo'           código de verificación al cliente
 *  - 'bienvenida-pro'       al profesional tras registrarse (TODO)
 *  - 'pago-aprobado'        al profesional tras webhook MP (TODO)
 *
 * Var EMAIL_REDIRECT_TO: en dev, redirige todos los emails a esa dirección
 * (destinatario real va en el subject). En prod dejá vacío para envíos reales.
 */

import nodemailer from 'nodemailer'

const EMAIL_FROM        = process.env.EMAIL_FROM || 'TuProfesional <noreply@tuprofesional.com>'
const EMAIL_REDIRECT_TO = process.env.EMAIL_REDIRECT_TO || null

const smtpConfigurado = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS

let transporter = null
if (smtpConfigurado) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true para 465, false para 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  console.log(`[Email] ✉️  SMTP listo (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587})${EMAIL_REDIRECT_TO ? ` — redirige todos los emails a ${EMAIL_REDIRECT_TO}` : ''}`)
} else {
  console.log('[Email] ⚠️  Sin SMTP configurado — los emails se loguean por consola (modo mock)')
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────
function renderTemplate(template, data = {}) {
  switch (template) {
    case 'solicitud-nueva':
      return {
        subject: `Nueva solicitud de ${data.clienteNombre} · ${data.categoria}`,
        html: `
          <h2 style="font-family:sans-serif;color:#1a1a1a">Hola ${escapeHtml(data.proNombre)},</h2>
          <p>Te llegó una solicitud nueva en <strong>TuProfesional</strong>.</p>
          <table style="font-family:sans-serif;font-size:14px;color:#333;line-height:1.6;border-collapse:collapse">
            <tr><td><strong>Categoría:</strong></td><td>${escapeHtml(data.categoria)}</td></tr>
            <tr><td><strong>Cliente:</strong></td><td>${escapeHtml(data.clienteNombre)}</td></tr>
            <tr><td><strong>Teléfono:</strong></td><td>${escapeHtml(data.clienteTelefono)}</td></tr>
            <tr><td><strong>Presupuesto orientativo:</strong></td><td>${escapeHtml(data.totalPresupuesto)}</td></tr>
          </table>
          ${data.mensajeExtra ? `<p><strong>Mensaje del cliente:</strong><br>${escapeHtml(data.mensajeExtra)}</p>` : ''}
          <p style="margin-top:24px">
            <a href="${data.link}" style="background:#1a1a1a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px">
              Ver en mi panel →
            </a>
          </p>
          <p style="color:#888;font-size:12px;margin-top:32px">
            Si no querés recibir más estos emails, configurá tu cuenta en el panel.
          </p>
        `,
      }

    case 'solicitud-aceptada':
      return {
        subject: `${data.proNombre} aceptó tu solicitud`,
        html: `
          <h2 style="font-family:sans-serif;color:#1a1a1a">Hola ${escapeHtml(data.clienteNombre)},</h2>
          <p><strong>${escapeHtml(data.proNombre)}</strong> aceptó tu pedido y puede empezar el trabajo.</p>
          <table style="font-family:sans-serif;font-size:14px;color:#333;line-height:1.6">
            <tr><td><strong>Teléfono:</strong></td><td>${escapeHtml(data.proTelefono || '—')}</td></tr>
            <tr><td><strong>Zona:</strong></td><td>${escapeHtml(data.proZona || '—')}</td></tr>
          </table>
          ${data.waLink ? `
            <p style="margin-top:20px">
              <a href="${data.waLink}" style="background:#25D366;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px">
                💬 Escribir por WhatsApp
              </a>
            </p>
          ` : ''}
          <p style="color:#888;font-size:12px;margin-top:32px">
            Recordá que TuProfesional no procesa pagos. El acuerdo es directo entre vos y el profesional.
          </p>
        `,
      }

    case 'solicitud-rechazada':
      return {
        subject: `Tu solicitud no fue aceptada`,
        html: `
          <h2 style="font-family:sans-serif;color:#1a1a1a">Hola ${escapeHtml(data.clienteNombre)},</h2>
          <p>Lamentablemente el profesional no pudo aceptar tu solicitud.</p>
          ${data.motivo ? `<p><strong>Motivo:</strong> ${escapeHtml(data.motivo)}</p>` : ''}
          <p>Probá con otro profesional desde TuProfesional.</p>
          <p style="margin-top:24px">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profesionales" style="background:#1a1a1a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px">
              Ver otros profesionales →
            </a>
          </p>
        `,
      }

    case 'otp-codigo':
      return {
        subject: `Tu código de TuProfesional: ${data.codigo}`,
        html: `
          <h2 style="font-family:sans-serif;color:#1a1a1a">Tu código de verificación</h2>
          <p style="font-family:sans-serif;font-size:14px;color:#333">Para confirmar tu solicitud, ingresá este código en TuProfesional:</p>
          <div style="margin:24px 0;text-align:center">
            <div style="display:inline-block;background:#fff8e1;border:1px solid #f5c518;border-radius:12px;padding:18px 32px;font-family:ui-monospace,Menlo,monospace;font-size:32px;letter-spacing:0.35em;font-weight:700;color:#1a1a1a">
              ${escapeHtml(data.codigo)}
            </div>
          </div>
          <p style="font-family:sans-serif;font-size:13px;color:#666;line-height:1.5">
            Este código vale por <strong>10 minutos</strong>. Si no pediste verificación, ignorá este mensaje.
          </p>
        `,
      }

    case 'solicitud-cerrada':
      return {
        subject: `${data.proNombre} terminó el trabajo · Dejá tu reseña`,
        html: `
          <h2 style="font-family:sans-serif;color:#1a1a1a">Hola ${escapeHtml(data.clienteNombre)},</h2>
          <p><strong>${escapeHtml(data.proNombre)}</strong> marcó tu trabajo como terminado.</p>
          <p>¿Cómo fue tu experiencia? Tu reseña ayuda a otros clientes a elegir mejor y al profesional a crecer en la plataforma.</p>
          <p style="margin-top:24px">
            <a href="${data.linkResena}" style="background:#f5c518;color:#1a1a1a;padding:12px 22px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:15px;font-weight:600">
              ⭐ Dejar reseña
            </a>
          </p>
          <p style="color:#888;font-size:12px;margin-top:32px">
            Este link es personal y vale por 30 días.
          </p>
        `,
      }

    default:
      return {
        subject: `[TuProfesional] ${template}`,
        html: `<pre style="font-family:monospace">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`,
      }
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ─────────────────────────────────────────────────────────────────────────────
// Punto de entrada
// ─────────────────────────────────────────────────────────────────────────────
export async function enviarEmail(to, template, data = {}) {
  if (!to) {
    console.warn(`[Email] ⚠️  Sin destinatario para template "${template}", salteo`)
    return
  }

  const { subject, html } = renderTemplate(template, data)

  // Modo dev sin SMTP: solo loguea
  if (!transporter) {
    console.log(`[Email MOCK] 📧 ${template} → ${to}`)
    console.log(`              from: ${EMAIL_FROM}`)
    console.log(`              subject: ${subject}`)
    console.log(`              data:`, JSON.stringify(data, null, 2))
    return { ok: true, mocked: true }
  }

  // Modo redirect (dev con SMTP): manda al user para testing
  const destinoEfectivo = EMAIL_REDIRECT_TO || to
  const subjectFinal    = EMAIL_REDIRECT_TO ? `[→ ${to}] ${subject}` : subject

  try {
    const info = await transporter.sendMail({
      from:    EMAIL_FROM,
      to:      destinoEfectivo,
      subject: subjectFinal,
      html,
    })
    console.log(`[Email] ✉️  Enviado "${template}" → ${destinoEfectivo} (${info.messageId})`)
    return { ok: true, messageId: info.messageId }
  } catch (error) {
    console.error(`[Email] ❌ Error enviando "${template}" → ${destinoEfectivo}:`, error.message)
    return { ok: false, error: error.message }
  }
}
