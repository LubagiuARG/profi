// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL

async function postJson(path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.detalle || 'Error del servidor')
  return data
}

async function patchJson(path, body, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body || {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.detalle || 'Error del servidor')
  return data
}

// ── Profesionales ──────────────────────────────────────────────

export async function getProfesionales(filtros = {}) {
  const params = new URLSearchParams(filtros).toString()
  const res = await fetch(`${API_URL}/api/profesionales?${params}`)
  if (!res.ok) throw new Error('Error al obtener profesionales')
  return res.json()
}

export async function registrarProfesional(datos) {
  return postJson('/api/profesionales', datos)
}

// ── Lead matching (cliente) ────────────────────────────────────

export async function enviarOtpCliente(telefono) {
  return postJson('/api/clientes/otp/enviar', { telefono })
}

export async function verificarOtpCliente(telefono, codigo) {
  return postJson('/api/clientes/otp/verificar', { telefono, codigo })
}

export async function getSugerenciasSolicitud(categoriaSlug, ubicacion) {
  return postJson('/api/solicitudes/sugerencias', { categoriaSlug, ubicacion })
}

export async function crearSolicitud(payload) {
  return postJson('/api/solicitudes', payload)
}

// ── Lead matching (panel del profesional) ──────────────────────

export async function getSolicitudesPanel(token) {
  const res = await fetch(`${API_URL}/api/panel/solicitudes`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Error al obtener solicitudes')
  return res.json()
}

export async function aceptarSolicitud(token, id) {
  return patchJson(`/api/panel/solicitudes/${id}/aceptar`, null, token)
}

export async function rechazarSolicitud(token, id, motivo) {
  return patchJson(`/api/panel/solicitudes/${id}/rechazar`, { motivo }, token)
}

export async function cerrarSolicitud(token, id) {
  return patchJson(`/api/panel/solicitudes/${id}/cerrar`, null, token)
}

// ── Reseñas ────────────────────────────────────────────────────

export async function getResenaInfo(token) {
  const res = await fetch(`${API_URL}/api/resenas/${token}/info`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Link inválido')
  return data
}

export async function crearResena(token, { rating, comentario }) {
  return postJson(`/api/resenas/${token}`, { rating, comentario })
}