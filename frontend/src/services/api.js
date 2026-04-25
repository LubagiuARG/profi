// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL

// ── Electricistas ──────────────────────────────────────────────

export async function getElectricistas(filtros = {}) {
  const params = new URLSearchParams(filtros).toString()
  const res = await fetch(`${API_URL}/api/electricistas?${params}`)
  if (!res.ok) throw new Error('Error al obtener electricistas')
  return res.json()
}

export async function registrarElectricista(datos) {
  const res = await fetch(`${API_URL}/api/electricistas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al registrar')
  return data
}