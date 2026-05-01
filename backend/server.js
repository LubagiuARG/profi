/**
 * ElectroAR — Servidor principal
 *
 * Incluye:
 * - API REST con Express
 * - Seguridad con Helmet + CORS + Rate limiting
 * - Scraper automático con node-cron (todos los días a las 3am)
 * - Scraping inicial al arrancar si no hay cache
 */

import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cron from 'node-cron'

import chatRouter            from './routes/chat.js'
import preciosRouter          from './routes/precios.js'
import profesionalesRouter    from './routes/profesionales.js'
import suscripcionesRouter    from './routes/suscripciones.js'
import authRouter             from './routes/auth.js'
import panelRouter            from './routes/panel.js'
import categoriasPublicRouter from './routes/categorias.js'
import adminAuthRouter        from './routes/admin/auth.js'
import adminCategoriasRouter  from './routes/admin/categorias.js'
import adminProfesRouter      from './routes/admin/profesionales.js'
import adminAdminsRouter      from './routes/admin/admins.js'
import { apiLimiter, chatLimiter } from './middleware/rateLimiter.js'
import { leerCachePrecios, scrapearPrecios } from './services/scraper.js'

const app  = express()
const PORT = process.env.PORT || 8080

// Necesario para Railway (proxy inverso)
app.set('trust proxy', 1)

// ─────────────────────────────────────────────────────────────────────────────
// Seguridad
// ─────────────────────────────────────────────────────────────────────────────
app.use(helmet())

const originesPermitidos = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://electro-ar-frontend-lubagiuargs-projects.vercel.app/',
  'https://electro-ar-frontend-git-main-lubagiuargs-projects.vercel.app/',
  'https://electro-ar-frontend-53joeuhcz-lubagiuargs-projects.vercel.app/',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (originesPermitidos.includes(origin)) return callback(null, true)
    callback(new Error(`CORS bloqueado para: ${origin}`))
  },
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'x-admin-token', 'Authorization'],
}))
app.use(express.json({ limit: '1mb' }))
app.use(apiLimiter)

// ─────────────────────────────────────────────────────────────────────────────
// Rutas
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/chat',    chatLimiter, chatRouter)
app.use('/api/precios', preciosRouter)
app.use('/api/profesionales', profesionalesRouter)
app.use('/api/suscripciones', suscripcionesRouter)
app.use('/api/auth',  authRouter)
app.use('/api/panel', panelRouter)
app.use('/api/categorias',          categoriasPublicRouter)
app.use('/api/admin/auth',          adminAuthRouter)
app.use('/api/admin/categorias',    adminCategoriasRouter)
app.use('/api/admin/profesionales', adminProfesRouter)
app.use('/api/admin/admins',        adminAdminsRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// Error handler global
app.use((err, req, res, next) => {
  console.error('[Server] Error no manejado:', err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scraping automático con CRON
// Todos los días a las 3:00am (horario Argentina = UTC-3)
// Para UTC puro sería las 6:00am UTC → "0 6 * * *"
// ─────────────────────────────────────────────────────────────────────────────
cron.schedule('0 3 * * *', async () => {
  console.log('[Cron] ⏰ Iniciando scraping programado de precios CMO...')
  try {
    await scrapearPrecios()
    console.log('[Cron] ✅ Scraping completado exitosamente')
  } catch (error) {
    console.error('[Cron] ❌ Error en scraping programado:', error.message)
  }
}, {
  timezone: 'America/Argentina/Buenos_Aires',
})

// ─────────────────────────────────────────────────────────────────────────────
// Arranque del servidor
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚡ ElectroAR Backend corriendo en http://localhost:${PORT}`)
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   CORS permitido: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  console.log('   Scraping automático: todos los días a las 3:00am (Argentina)\n')

  // Scraping en SEGUNDO PLANO — no bloquea el arranque
  // Railway necesita que el servidor responda al healthcheck antes de 30s
  setTimeout(async () => {
    try {
      const cache = await leerCachePrecios()
      if (!cache) {
        console.log('[Startup] No hay cache. Iniciando scraping en segundo plano...')
        await scrapearPrecios()
      } else {
        const horas = ((Date.now() - new Date(cache.actualizadoEn).getTime()) / 3600000).toFixed(1)
        console.log(`[Startup] Cache encontrado (hace ${horas}hs). Listo.`)
      }
    } catch (error) {
      console.error('[Startup] Error en scraping inicial:', error.message)
      console.warn('[Startup] Servidor activo pero sin precios. Usá POST /api/precios/actualizar')
    }
  }, 3000)
})