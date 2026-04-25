/**
 * ElectroAR — Scraper de precios CMO
 * Fuente: electroinstalador.com/paginas/p43-cmo-listado-de-costos-de-mano-de-obra
 *
 * Parsea el HTML de la página y extrae los valores de mano de obra,
 * guardándolos en un archivo JSON local (cache).
 * En producción podés reemplazar el guardado por INSERT en PostgreSQL.
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = path.join(__dirname, '../cache/precios.json')
const CACHE_DIR  = path.join(__dirname, '../cache')

const SCRAPER_URL =
  process.env.SCRAPER_URL ||
  'https://www.electroinstalador.com/paginas/p43-cmo-listado-de-costos-de-mano-de-obra'

// ─────────────────────────────────────────────────────────────────────────────
// Parsear el HTML de la página CMO
// ─────────────────────────────────────────────────────────────────────────────
function parsearPrecios(html) {
  const $ = cheerio.load(html)
  const secciones = []
  let seccionActual = null

  // La página usa h1/h3 para títulos de sección y párrafos con precios en negrita
  $('h1, h3, p, li').each((_, el) => {
    const tag  = el.tagName.toLowerCase()
    const texto = $(el).text().trim()

    if (!texto) return

    // Detectar títulos de sección (h1 grandes o h3 con nombres de categorías)
    if (tag === 'h1' && texto.length < 60 && !texto.includes('CMO |')) {
      seccionActual = { titulo: texto, items: [] }
      secciones.push(seccionActual)
      return
    }

    if (tag === 'h3' && texto.length < 80) {
      // Subsección dentro de la sección actual
      if (seccionActual) {
        seccionActual.items.push({ tipo: 'subtitulo', texto })
      }
      return
    }

    // Detectar líneas con precio (contienen $)
    if (texto.includes('$') && seccionActual) {
      // Extraer pares "descripción: $precio"
      const lineas = texto.split('\n')
      for (const linea of lineas) {
        const limpia = linea.trim()
        if (!limpia.includes('$')) continue

        // Buscar patrón: "Descripción ... $NNN.NNN"
        const match = limpia.match(/^(.+?)[:.]{0,1}\s*\$\s*([\d.,]+)/)
        if (match) {
          const descripcion = match[1].trim().replace(/\.+$/, '').trim()
          const valor = '$' + match[2].trim()
          if (descripcion.length > 2 && descripcion.length < 120) {
            seccionActual.items.push({ tipo: 'precio', descripcion, valor })
          }
        }
      }
    }
  })

  return secciones.filter(s => s.items.length > 0)
}

// ─────────────────────────────────────────────────────────────────────────────
// Convertir secciones parseadas a texto plano para el prompt de Claude
// ─────────────────────────────────────────────────────────────────────────────
function seccionesATexto(secciones) {
  let texto = 'COSTOS DE MANO DE OBRA — Fuente: ElectroInstalador.com\n'
  texto += `Actualizado: ${new Date().toLocaleDateString('es-AR')}\n`
  texto += 'Solo mano de obra. No incluye materiales, impuestos ni viáticos.\n\n'

  for (const seccion of secciones) {
    texto += `═══ ${seccion.titulo.toUpperCase()} ═══\n`
    for (const item of seccion.items) {
      if (item.tipo === 'subtitulo') {
        texto += `  [${item.texto}]\n`
      } else {
        texto += `  ${item.descripcion}: ${item.valor}\n`
      }
    }
    texto += '\n'
  }

  return texto
}

// ─────────────────────────────────────────────────────────────────────────────
// Función principal: scrapear y guardar en cache
// ─────────────────────────────────────────────────────────────────────────────
export async function scrapearPrecios() {
  console.log(`[Scraper] Iniciando scraping de ${SCRAPER_URL}`)

  try {
    // Fetch con User-Agent de navegador para evitar bloqueos
    const response = await axios.get(SCRAPER_URL, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'es-AR,es;q=0.9',
    Accept: 'text/html,application/xhtml+xml',
  },
  timeout: 15000,
})

const html = response.data

    if (!html.includes('$')) {
      throw new Error('El HTML no contiene precios — posible bloqueo o cambio en el sitio')
    }

    const secciones = parsearPrecios(html)

    if (secciones.length === 0) {
      throw new Error('No se encontraron secciones de precios en el HTML')
    }

    const textoPlano = seccionesATexto(secciones)

    // Guardar en cache
    await fs.mkdir(CACHE_DIR, { recursive: true })
    const cache = {
      actualizadoEn: new Date().toISOString(),
      fuente: SCRAPER_URL,
      seccionesCount: secciones.length,
      preciosCount: secciones.reduce((acc, s) => acc + s.items.filter(i => i.tipo === 'precio').length, 0),
      secciones,
      textoPlano,
    }

    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8')

    console.log(`[Scraper] ✅ Éxito: ${cache.seccionesCount} secciones, ${cache.preciosCount} precios guardados`)
    console.log(`[Scraper] Cache guardado en: ${CACHE_FILE}`)

    return cache

  } catch (error) {
    console.error('[Scraper] ❌ Error:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Leer cache guardado
// ─────────────────────────────────────────────────────────────────────────────
export async function leerCachePrecios() {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf-8')
    const cache = JSON.parse(raw)

    // Verificar antigüedad (más de 25 horas → avisar)
    const horasDesdeActualizacion =
      (Date.now() - new Date(cache.actualizadoEn).getTime()) / 1000 / 3600

    if (horasDesdeActualizacion > 25) {
      console.warn(`[Scraper] ⚠️  Cache tiene ${horasDesdeActualizacion.toFixed(1)} horas de antigüedad`)
    }

    return cache
  } catch {
    // Si no hay cache, retornar null (el servidor iniciará un scraping)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ejecutar directamente: node services/scraper.js
// ─────────────────────────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scrapearPrecios()
    .then(cache => {
      console.log('\n── Vista previa del texto generado ──')
      console.log(cache.textoPlano.slice(0, 1000) + '...')
    })
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}
