# Profi · Monorepo

Plataforma argentina de presupuestos con IA + directorio de profesionales (electricistas, plomeros, gasistas, etc.).

> Antes se llamaba **ElectroAR**. Rebranding cosmético pendiente — ver [`docs/06-rebranding.md`](./docs/06-rebranding.md).

## Estructura

```
backend/   API + scraper (Node 20 + Express + Prisma + PostgreSQL)  → ./backend/CLAUDE.md
frontend/  Web pública + admin (React 18 + Vite + React Router 6)   → ./frontend/CLAUDE.md
docs/      Visión, scope, flujos, modelo, rebranding, roadmap, backlog
```

## Cuándo entrar a cada carpeta

- **Tarea de API / DB / scraping / pagos / auth** → `backend/CLAUDE.md`
- **Tarea de UI / pages / componentes / estilos** → `frontend/CLAUDE.md`
- **Pregunta de producto / decisión de scope / qué tarea tomar** → `docs/`

## Comandos del workspace root

```bash
npm install                    # instala backend y frontend de una (npm workspaces)
npm run dev:backend            # arranca API
npm run dev:frontend           # arranca web
npm run build:frontend         # build de producción del frontend
```

Para Prisma y otros comandos específicos del backend, entrar a `backend/` y correrlos desde ahí.

## Deploys (ya andando)

- **Railway** — backend, root directory `backend/`
- **Vercel** — frontend, root directory `frontend/`

## Backlog

Tareas vivas en [`docs/backlog/`](./docs/backlog/). El archivo `backlog.csv` es importable a GitHub Projects o Linear.

Convención de IDs:
- `BE-XXX` — tarea de backend
- `FE-XXX` — tarea de frontend
- `OP-XXX` — tarea de producto / operaciones

## Convenciones globales

- **Idioma:** español (incluyendo nombres de variables, archivos, commits).
- **No tocar código de feature sin tarea asociada en el backlog.**
- **PRs cross-stack** (back + front juntos) son OK y esperables — es la ventaja del monorepo.
