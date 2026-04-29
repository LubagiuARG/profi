// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL

// ── Profesionales ──────────────────────────────────────────────

export async function getProfesionales(filtros = {}) {
  const params = new URLSearchParams(filtros).toString()
  const res = await fetch(`${API_URL}/api/profesionales?${params}`)
  if (!res.ok) throw new Error('Error al obtener profesionales')
  return res.json()
}

export async function registrarProfesional(datos) {
  const res = await fetch(`${API_URL}/api/profesionales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al registrar')
  return data
}