// Cliente del chat de TuProfesional contra el backend.
// La API key de Anthropic vive SOLO en el backend — nunca en el frontend.

const API_URL = import.meta.env.VITE_API_URL

export async function askClaude(messages, userType = 'particular', categoriaSlug) {
  if (!API_URL) {
    throw new Error('Falta VITE_API_URL en el .env del frontend')
  }

  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, userType, categoriaSlug }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || data.detalle || 'Error del servidor')
  }
  return res.json()
}
