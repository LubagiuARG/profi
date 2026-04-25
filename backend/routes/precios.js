/**
 * ElectroAR — Ruta /api/precios
 * Permite consultar el estado del cache y disparar un scraping manual.
 */

import { Router } from 'express'
import { leerCachePrecios, scrapearPrecios } from '../services/scraper.js'

const router = Router()

// GET /api/precios/estado — Ver estado del cache
router.get('/estado', async (req, res) => {
  try {
    const cache = await leerCachePrecios()

    if (!cache) {
      return res.json({
        estado: 'sin_cache',
        mensaje: 'No hay precios cacheados. Ejecutá un scraping primero.',
      })
    }

    const horasDesdeActualizacion =
      (Date.now() - new Date(cache.actualizadoEn).getTime()) / 1000 / 3600

    return res.json({
      estado: horasDesdeActualizacion < 25 ? 'vigente' : 'desactualizado',
      actualizadoEn: cache.actualizadoEn,
      horasDesdeActualizacion: Math.round(horasDesdeActualizacion * 10) / 10,
      seccionesCount: cache.seccionesCount,
      preciosCount: cache.preciosCount,
      fuente: cache.fuente,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

// GET /api/precios/datos — Ver todos los precios cacheados
router.get('/datos', async (req, res) => {
  try {
    const cache = await leerCachePrecios()
    if (!cache) return res.status(404).json({ error: 'Sin cache de precios' })
    return res.json(cache.secciones)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

// POST /api/precios/actualizar — Disparar scraping manualmente
// (en producción protegerlo con un token de admin)
router.post('/actualizar', async (req, res) => {
  const adminToken = req.headers['x-admin-token']
  if (process.env.ADMIN_TOKEN && adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    console.log('[Precios] Scraping manual iniciado...')
    const cache = await scrapearPrecios()
    return res.json({
      ok: true,
      mensaje: `Scraping completado: ${cache.preciosCount} precios actualizados`,
      actualizadoEn: cache.actualizadoEn,
    })
  } catch (error) {
    return res.status(500).json({ error: `Error en scraping: ${error.message}` })
  }
})

export default router
