/**
 * TuProfesional — Envío de emails transaccionales.
 *
 * En dev: loguea por consola.
 * En prod: cuando haya Resend conectado (BE-005), reemplazar `enviarEmail` por la llamada real.
 *
 * Templates conocidos:
 *  - 'solicitud-nueva'      al profesional cuando llega una solicitud
 *  - 'solicitud-aceptada'   al cliente cuando el pro acepta
 *  - 'solicitud-rechazada'  al cliente cuando el pro rechaza
 *  - 'bienvenida-pro'       al profesional tras registrarse
 *  - 'pago-aprobado'        al profesional tras webhook MP
 */

const EMAIL_FROM = process.env.EMAIL_FROM || 'TuProfesional <noreply@tuprofesional.com>'

export async function enviarEmail(to, template, data = {}) {
  if (!to) {
    console.warn(`[Email] ⚠️ Sin destinatario para template "${template}", salteo`)
    return
  }

  // En dev, loguear y volver. Cuando integremos Resend, este bloque cambia.
  if (!process.env.EMAIL_API_KEY) {
    console.log(`[Email MOCK] 📧 ${template} → ${to}`)
    console.log(`              from: ${EMAIL_FROM}`)
    console.log(`              data:`, JSON.stringify(data, null, 2))
    return { ok: true, mocked: true }
  }

  // TODO BE-005: integrar Resend
  // const res = await fetch('https://api.resend.com/emails', { ... })
  console.warn(`[Email] ⚠️ EMAIL_API_KEY seteado pero Resend no integrado todavía (template: ${template})`)
  return { ok: false, motivo: 'Resend no implementado' }
}
