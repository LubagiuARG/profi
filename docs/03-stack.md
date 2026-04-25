# 03 · Stack técnico

## Resumen

```
Cliente Web (React/Vite)  →  API REST (Express)  →  PostgreSQL (Prisma)
                                  ↓                       ↑
                                  ↓ ┌────────────────────┘
                                  ↓ ↓
                             Anthropic API (Claude)
                             MercadoPago (suscripciones)
                             electroinstalador.com (scraping CMO)
                             georef.gob.ar (localidades AR)
```

## Backend — `electro-ar-backend`

| Capa | Elección | Por qué |
|------|----------|---------|
| Runtime | Node 20 (ESM, `"type": "module"`) | LTS, suficiente para Express, ESM por modernidad |
| Framework | Express 4 | Simple, conocido, suficiente para REST sencillo. No necesitamos Nest/Fastify aún |
| ORM | Prisma 5 + PostgreSQL | Migrations declarativas, types autogenerados, ergonomía |
| DB | PostgreSQL administrado en Railway | Lo más simple para empezar. Podemos migrar a Neon/Supabase si hace falta |
| IA | `@anthropic-ai/sdk` (Claude Sonnet 4.6) | Mejor calidad/precio para JSON estructurado en español. Caching cuando lo activemos |
| Pagos | MercadoPago `PreApproval` | Único proveedor argentino de suscripciones recurrentes en pesos |
| Scraping | `axios` + `cheerio` | HTML estático parseable, no requiere Playwright/Puppeteer |
| Cron | `node-cron` (in-process) | El servidor de Railway corre 24/7, no necesitamos worker separado todavía |
| Auth | JWT firmado + `bcryptjs` | Stateless, simple. Sin refresh tokens por ahora |
| Seguridad | `helmet`, CORS whitelist, `express-rate-limit` | Defaults razonables. CORS contra `FRONTEND_URL` |

### Variables de entorno (backend)

```
PORT                  Puerto local (default 8080 en Railway)
ANTHROPIC_API_KEY     Clave de Claude (NUNCA al frontend)
DATABASE_URL          Postgres de Railway
JWT_SECRET            Secreto para firmar tokens
MP_ACCESS_TOKEN       MercadoPago — Access Token de la cuenta del seller
FRONTEND_URL          URL del frontend para CORS y back_url de MP
SCRAPER_URL           URL de la tabla CMO (electroinstalador.com)
ADMIN_TOKEN           Token simple para disparar scraping manual via API
```

### Estructura
```
electro-ar-backend/
├── server.js              entrada + cron + middlewares globales
├── routes/
│   ├── chat.js            POST /api/chat        — IA + precios
│   ├── precios.js         GET/POST /api/precios — cache de scraping
│   ├── electricistas.js   /api/electricistas    — directorio público + CRUD
│   ├── auth.js            /api/auth/*           — registro/login profesional
│   ├── panel.js           /api/panel/*          — perfil propio del profesional
│   ├── suscripciones.js   /api/suscripciones    — MP PreApproval + webhook
│   ├── categorias.js      /api/categorias       — listado público
│   └── admin/
│       ├── auth.js        /api/admin/auth       — login admin
│       ├── categorias.js  /api/admin/categorias
│       ├── profesionales.js
│       └── admins.js
├── services/
│   ├── scraper.js         lógica de scraping y parseo HTML
│   └── seed.js            categorías + admin inicial
├── middleware/
│   ├── auth.js            verificación JWT profesional
│   ├── adminAuth.js       verificación JWT admin
│   └── rateLimiter.js
├── prisma/
│   └── schema.prisma
└── cache/
    └── precios.json       (gitignored, generado en runtime)
```

## Frontend — `electro-ar-frontend`

| Capa | Elección | Por qué |
|------|----------|---------|
| Framework | React 18 + Vite 5 | Vite por velocidad de dev, React por ecosistema |
| Routing | React Router 6 (`BrowserRouter`) | Estándar |
| Estilos | CSS Modules | Scope por componente, sin runtime cost. Si en algún momento necesitamos design system, evaluar Tailwind |
| Estado | Context API (`AuthContext`, `AdminContext`) | Solo usuario autenticado — no necesitamos Redux/Zustand |
| HTTP | `fetch` nativo, helpers en `services/api.js` y `services/adminApi.js` | Sin axios para no agregar dependencia |

### Variables de entorno (frontend)

```
VITE_API_URL          URL del backend (en local: http://localhost:3001)
VITE_MP_PUBLIC_KEY    Public key de MercadoPago (sólo si usamos Checkout embebido — hoy redirigimos al init_point)
```

> ⚠️ El README viejo menciona `VITE_ANTHROPIC_KEY`. **No usar.** La clave de Anthropic vive solo en el backend.

### Estructura
```
electro-ar-frontend/src/
├── App.jsx                rutas (públicas + protegidas + admin)
├── main.jsx
├── components/            Header, Footer, AdBanner, BuscadorGeo, SelectorUbicacion
├── pages/                 Home, Presupuesto, Electricistas, Registro, Login, Panel
│   └── admin/             AdminLogin, AdminDashboard, AdminCategorias, AdminProfesionales, AdminAdmins
├── context/               AuthContext, AdminContext
├── hooks/                 useChat
├── services/              api.js (público), adminApi.js, claude.js (legacy?), georef.js
└── styles/                global.css (tokens y utilidades)
```

## Decisiones que vale la pena documentar

### Por qué Prisma y no SQL crudo
La schema con relaciones (Electricista ↔ Categoria ↔ Pago ↔ Resena) se vuelve insoportable con SQL crudo. Prisma nos da migrations, types y un cliente cómodo. Tradeoff: lock-in y dependencia de su CLI.

### Por qué JWT y no sesiones
No tenemos backend con estado compartido. JWT permite escalar horizontalmente sin Redis ni sticky sessions. Tradeoff: revocar tokens es complejo (no lo necesitamos hoy).

### Por qué scraping y no API
ElectroInstalador no expone API. El HTML es razonablemente estable. Si cambia, el scraper falla → el cache anterior sigue sirviendo + log de warning. Para otros rubros (plomería/gas) habrá que decidir caso por caso.

### Por qué MercadoPago y no Stripe
- En Argentina la mayoría de los profesionales tiene cuenta MercadoPago, no tarjeta internacional
- Cobramos en ARS, evitamos lío de divisas
- Stripe no opera con cuentas argentinas todavía (abril 2026)

### Por qué Vercel + Railway y no AWS / Vercel + Vercel
- Vercel para el frontend: free tier suficiente, deploy automático desde Git, edge cache
- Railway para el backend + DB: más barato que Vercel functions con DB administrada, soporta cron in-process
- Cuando tengamos volumen, evaluamos Fly.io o un VPS dedicado
