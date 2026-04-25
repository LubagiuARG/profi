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

## Workflow de branches

- `main` = producción (estable, lo que está deployado)
- `develop` = trabajo del día a día — empezar acá
- Para una tarea: branch desde `develop` → PR → merge a `develop`
- Releases: PR de `develop` → `main`
- **Nunca pushear directo a `main`** una vez que esté conectado a deploys

## Estado del proyecto (abril 2026)

- Repo: `https://github.com/gonzalo2309/profi`
- Project (90 tareas con prioridades): `https://github.com/users/gonzalo2309/projects/6`
- Auto-add workflow activado: issues nuevos del repo caen al board solos
- Deploy en Vercel (frontend) + Railway (backend + Postgres) — pendiente reapuntar al monorepo (lo hace el amigo)

## Cómo trabajar tareas del backlog

1. Abrir el Project, filtrar por `label:P0` para arrancar por bloqueantes
2. Mover la card a "In Progress" y asignarla
3. Crear branch desde `develop`: `git checkout develop && git pull && git checkout -b <tipo>/<id>-<slug>` (ej: `feat/BE-003-rebranding-prompts`)
4. Hacer el cambio + commit con referencia al issue (`Closes #N`)
5. Push y abrir PR contra `develop`
6. Al mergear, el issue se cierra solo y la card se mueve a "Done"

## Tooling

- `scripts/import-backlog.mjs` y `scripts/complete-import.mjs` — sincronizar `docs/backlog/backlog.csv` → GitHub. Ver `scripts/README.md`.
- Si agregás tareas al `backlog.csv` y querés re-sincronizar, correr `node scripts/complete-import.mjs 6` (idempotente).
- `gh` CLI requiere scope `project` para Projects v2: `gh auth refresh -s project --hostname github.com`.
