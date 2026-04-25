import rateLimit from 'express-rate-limit'

// Límite general de la API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                  // máx 100 requests por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intentá de nuevo en 15 minutos.' },
})

// Límite más estricto para el chat (evitar abuso de la API de Claude)
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,             // máx 10 consultas al chat por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas consultas al asistente. Esperá un momento.' },
})
