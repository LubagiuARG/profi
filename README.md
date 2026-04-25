# Profi

Plataforma argentina de **presupuestos con IA** y **directorio de profesionales verificados** (electricistas, plomeros, gasistas, pintores, etc.).

> Antes se llamaba **ElectroAR**. Rebranding cosmético pendiente — ver [`docs/06-rebranding.md`](./docs/06-rebranding.md).

## Estructura del monorepo

```
profi/
├── backend/         API + scraper + cron (Node 20 + Express + Prisma)
├── frontend/        Web pública + panel + admin (React 18 + Vite)
└── docs/            Visión, scope, flujos, modelo, rebranding, roadmap, backlog
```

Cada subproyecto tiene su propio `CLAUDE.md` con detalles de stack, comandos y convenciones.

## Cómo correr todo en local

### Pre-requisitos
- Node 20 o superior
- PostgreSQL local o connection string a Postgres administrado (Railway, Neon, Supabase…)

### Setup inicial (una vez)

```bash
# 1. Instalar dependencias de los dos workspaces de una
npm install

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Editar ambos con los valores reales

# 3. Aplicar migrations en la DB
cd backend
npx prisma migrate dev
cd ..
```

### Día a día

```bash
# Backend (puerto 3001 o el que setees en PORT)
npm run dev:backend

# Frontend (puerto 5173)
npm run dev:frontend

# Build del frontend (genera frontend/dist)
npm run build:frontend
```

Comandos avanzados (correr desde `backend/`):
```bash
cd backend
npx prisma studio            # GUI de la DB
npx prisma migrate deploy    # aplicar migrations en prod
npm run scrape               # scraping manual de precios CMO
```

## Deploys

| Servicio | Plataforma | Root Directory |
|----------|------------|----------------|
| API + scraper | Railway | `backend/` |
| Web | Vercel | `frontend/` |

Las variables de entorno se configuran en el panel de cada plataforma — **no se migran solas** entre proyectos.

## Documentación

Ver [`docs/`](./docs/). Punto de entrada: [`docs/README.md`](./docs/README.md).

- [`docs/01-vision.md`](./docs/01-vision.md) — qué resolvemos y para quién
- [`docs/02-scope-mvp.md`](./docs/02-scope-mvp.md) — qué entra al MVP
- [`docs/03-stack.md`](./docs/03-stack.md) — decisiones técnicas
- [`docs/04-flujos.md`](./docs/04-flujos.md) — flujos clave
- [`docs/05-modelo-datos.md`](./docs/05-modelo-datos.md) — entidades
- [`docs/06-rebranding.md`](./docs/06-rebranding.md) — checklist ElectroAR → Profi
- [`docs/07-roadmap.md`](./docs/07-roadmap.md) — fases
- [`docs/backlog/`](./docs/backlog/) — tareas vivas (`backlog.csv` importable a GitHub Projects / Linear)
