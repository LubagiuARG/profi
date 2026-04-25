/**
 * ElectroAR — Ruta /api/chat
 * Recibe la consulta del usuario, inyecta los precios actualizados
 * del scraper en el system prompt de Claude y retorna el presupuesto.
 */

import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { leerCachePrecios, scrapearPrecios } from '../services/scraper.js'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─────────────────────────────────────────────────────────────────────────────
// Obtener precios (desde cache o scrapear si no hay)
// ─────────────────────────────────────────────────────────────────────────────
async function obtenerPrecios() {
  let cache = await leerCachePrecios()

  if (!cache) {
    console.log('[Chat] No hay cache de precios — iniciando scraping...')
    cache = await scrapearPrecios()
  }

  return cache
}

// ─────────────────────────────────────────────────────────────────────────────
// Construir system prompt con precios actualizados
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(textoPrecios, userType, fechaActualizacion) {
  const fecha = new Date(fechaActualizacion).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const esProfesional = userType === 'profesional'

  const instruccionesProfesional = esProfesional ? `
MODO PROFESIONAL ACTIVO:
- El usuario ES el electricista que va a realizar el trabajo
- Generá un presupuesto más detallado y profesional
- Incluí tiempo estimado de trabajo en horas
- Separar claramente: mano de obra, materiales, y subtotales
- Agregá una línea de "Validez del presupuesto: 7 días"
- Mencioná que el presupuesto no incluye imprevistos
- Usá lenguaje técnico apropiado para un profesional
` : `
MODO CLIENTE ACTIVO:
- El usuario es un particular que necesita el trabajo
- Usá lenguaje simple y claro
- Explicá brevemente en qué consiste el trabajo
`

  return `Sos el asistente de ElectroAR, plataforma argentina de presupuestos eléctricos.
Tu rol es calcular presupuestos de mano de obra orientativos usando la tabla de precios actualizada.

TIPO DE USUARIO: ${userType}
${instruccionesProfesional}

${textoPrecios}

INSTRUCCIONES:
1. Analizá el trabajo descripto
2. Identificá los ítems de la tabla CMO que corresponden
3. MULTIPLICÁ el precio unitario por la cantidad de unidades:
   - Si son 7 bocas y el CMO dice $48.700/boca → el costo es $48.700 × 7 = $340.900
   - NUNCA muestres el precio unitario como total sin multiplicar
4. Mostrá en el label la cuenta realizada: "Canalización PVC × 7 bocas"
5. Estimá materiales por separado (50-70% del costo de mano de obra)
6. Mostrá mano de obra y materiales SIEMPRE separados
7. Si requiere matrícula habilitante, mencionalo en notas
8. Precios actualizados al: ${fecha}

Respondé SOLO con JSON válido, sin markdown, sin backticks:
{"texto":"explicación","items":[{"label":"ítem × cantidad","val":"$XX.XXX"}],"total":"$XX.XXX – $XX.XXX","notas":"aclaraciones"}`
}
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chat
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { messages, userType = 'particular', modo } = req.body
    const tipoEfectivo = modo === 'presupuesto_profesional' ? 'profesional' : userType

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'El campo messages es requerido y debe ser un array' })
    }

    // Obtener precios actualizados
    const cache = await obtenerPrecios()

    // Llamar a Claude con los precios inyectados
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: buildSystemPrompt(cache.textoPlano, tipoEfectivo, cache.actualizadoEn),
      messages: messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : (m.ui?.text || ''),
      })),
    })

    const raw = response.content?.[0]?.text || ''
    const clean = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      parsed = { texto: clean, items: [], total: '', notas: '' }
    }

    // Agregar metadata de precios en la respuesta
    return res.json({
      ...parsed,
      _meta: {
        preciosActualizados: cache.actualizadoEn,
        fuente: cache.fuente,
      },
    })

  } catch (error) {
    console.error('[Chat] Error:', error.message)
    return res.status(500).json({ error: 'Error interno del servidor', detalle: error.message })
  }
})

export default router
