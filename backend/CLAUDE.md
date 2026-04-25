# Profi · Backend

API REST + scraper para **Profi** — plataforma argentina de presupuestos y directorio de profesionales (electricistas, plomeros, gasistas, pintores, etc.).

> Antes se llamaba **ElectroAR**. Rebranding pendiente — ver [`../docs/06-rebranding.md`](../docs/06-rebranding.md).

## Stack

Node 20 (ESM) · Express 4 · Prisma 5 + PostgreSQL · Anthropic SDK · MercadoPago `PreApproval` · `cheerio` + `axios` para scraping · `node-cron` · JWT + bcrypt · helmet + cors + rate-limit.

Deploy: **Railway** (ya andando).

## Comandos

```bash
npm install
cp .env.example .env             # completar las vars, ver abajo
npx prisma migrate dev           # aplicar migrations en DB local
npx prisma generate              # regenerar el cliente

npm run dev                      # node --watch server.js (puerto 3001/8080)
npm run start                    # production
npm run scrape                   # scraping manual de precios CMO

# Prisma helpers comunes
npx prisma studio                # GUI de la DB
npx prisma migrate deploy        # aplicar migrations en prod
```

## Variables de entorno

```
PORT
ANTHROPIC_API_KEY     # Claude — vive solo aquí, NUNCA en el frontend
DATABASE_URL          # Postgres (Railway)
JWT_SECRET            # firmar tokens — debe ser obligatorio en prod
MP_ACCESS_TOKEN       # MercadoPago seller token
MP_WEBHOOK_SECRET     # (pendiente BE-001) verificar firma del webhook
FRONTEND_URL          # CORS + back_url de MP
SCRAPER_URL           # tabla CMO de electroinstalador.com
ADMIN_TOKEN           # disparar scraping manual via API
```

## Estructura

```
server.js              entrada: Express + middlewares globales + cron diario
routes/
  chat.js              POST /api/chat              — Claude + tabla de precios
  precios.js           /api/precios                — cache del scraper
  electricistas.js     /api/electricistas          — directorio público + CRUD
  auth.js              /api/auth                   — registro/login profesional
  panel.js             /api/panel                  — perfil propio
  suscripciones.js     /api/suscripciones          — MP PreApproval + webhook
  categorias.js        /api/categorias             — listado público de rubros
  admin/*.js           /api/admin/*                — auth, categorias, profes, admins
services/
  scraper.js           parseo HTML CMO, cache JSON
  seed.js              categorías + admin inicial
middleware/
  auth.js              JWT profesional
  adminAuth.js         JWT admin (chequea rol)
  rateLimiter.js       100/15min general · 10/min en /api/chat
prisma/schema.prisma   Electricista, Categoria, Admin, Pago, Resena
cache/precios.json     (gitignored, generado en runtime)
```

## Convenciones

- **Idioma:** todo el código y comentarios en español (variables incluidas).
- **ESM puro** (`import/export`). No mezclar con `require`.
- **Logs prefijados** por área: `[Chat]`, `[Auth]`, `[Webhook MP]`, `[Cron]`, `[Startup]`. Mantener este formato.
- **Errores:** capturar en cada handler, loguear `error.message`, devolver JSON `{ error: '...' }` con status apropiado.
- **Sin TS** por ahora — agregar tipos solo si la deuda lo justifica.
- **Sin tests** todavía — sumar `vitest` en `BE-015`.

## Gotchas

1. **`server.js:121`** scrapea en background tras 3s para no bloquear el healthcheck de Railway (timeout 30s).
2. **`routes/chat.js`** asume que la tabla de precios es de electricistas. Para multi-rubro ver `BE-004`.
3. **Webhook MP `routes/suscripciones.js:73`** no verifica firma — riesgo de spoofing. Ver `BE-001`.
4. **`middleware/auth.js`** tiene `JWT_SECRET` con default — fix en `BE-016`.
5. **CORS whitelist** en `server.js:42-48` está hardcoded con dominios de ElectroAR. Sumar dominio nuevo cuando llegue Profi.
6. **`prisma.electricista`** seguirá llamándose así hasta `BE-013` — no renombrar manualmente sin migration.

## Backlog

Las tareas concretas viven en [`../docs/backlog/tareas-backend.md`](../docs/backlog/tareas-backend.md).

Antes de tomar una tarea, asegurarse de que no esté marcada como `🟦 EN CURSO`.

## Docs del monorepo

[`../docs/`](../docs/) — visión, scope, modelo, flujos, rebranding, roadmap.
