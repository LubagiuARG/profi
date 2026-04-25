/*
  En producción: NUNCA exponer la API key en el frontend.
  Las llamadas deben pasar por tu backend Node.js.
  
  Desarrollo local: usá .env con VITE_ANTHROPIC_KEY
  Producción:       usá VITE_API_URL apuntando a tu backend
*/

const SYSTEM_PROMPT = `Sos el asistente de DonVoltio, una plataforma argentina de presupuestos eléctricos.
Cuando el usuario describa un trabajo eléctrico, calculá un presupuesto orientativo basado en 
tarifas vigentes de FADEERA (Federación Argentina de Asociaciones de Empresarios Electricistas)
, COPIME (Consejo Profesional de Ingeniería Mecánica y Electromecánica) y electroinstalador.

Respondé SIEMPRE en formato JSON válido, sin markdown, sin backticks, sin texto adicional:
{
  "texto": "Explicación breve y clara del presupuesto (2-3 oraciones)",
  "items": [
    { "label": "Concepto del ítem", "val": "$X.000 – $Y.000" }
  ],
  "total": "$X.000 – $Y.000",
  "notas": "Tip profesional o aclaración importante (opcional)"
}

Consideraciones:
- Usá pesos argentinos (ARS) con valores realistas al 2025
- Siempre mostrá un rango mínimo-máximo para ser honesto
- Incluí mano de obra Y materiales por separado
- Si el trabajo requiere matrícula habilitante, mencionalo en notas
- Tipos de usuario: particular (hogar), comercio, industria
- Sé conciso pero útil`

export async function askClaude(messages, userType = 'particular') {
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY
  const apiUrl = import.meta.env.VITE_API_URL

  // En producción: usar tu propio backend
  if (apiUrl) {
    const res = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userType }),
    })
    if (!res.ok) throw new Error('Error del servidor')
    return res.json()
  }

  // Desarrollo directo con Anthropic (solo con VITE_ANTHROPIC_KEY)
  if (!apiKey) throw new Error('Falta VITE_ANTHROPIC_KEY en .env')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + `\nTipo de usuario: ${userType}`,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Error en la API')
  }

  const data = await res.json()
  const raw = data.content[0]?.text || ''

  try {
    return JSON.parse(raw)
  } catch {
    // Si no viene JSON válido, retornar texto plano
    return { texto: raw, items: [], total: '', notas: '' }
  }
}
