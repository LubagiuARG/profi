# TuProfesional — Documentación de producto

Plataforma argentina de **presupuestos inteligentes con IA** y **directorio de profesionales verificados** (electricistas, plomeros, gasistas, pintores, albañiles, etc.).

> Marca user-facing: **TuProfesional** (junto). Originalmente fue **ElectroAR** (solo electricistas) y por un tiempo se pensó como **Profi**; el directorio del repo se sigue llamando `profi/` por historia. Ver [`06-rebranding.md`](./06-rebranding.md).

> ⚠️ Otros docs de esta carpeta (`02-scope-mvp.md`, `07-roadmap.md`, etc.) todavía mencionan "Profi" — son referencias internas obsoletas, no se usan en UI.

## Repos del proyecto

| Repo | Path | Stack | Deploy |
|------|------|-------|--------|
| Backend (API + scraper) | `../electro-ar-backend` | Node 20 + Express + Prisma + PostgreSQL | Railway |
| Frontend (web) | `../electro-ar-frontend` | React 18 + Vite + React Router 6 | Vercel |

> Los nombres de los repos siguen siendo `electro-ar-*`. Renombrarlos es parte del trabajo de rebranding pendiente.

## Mapa de docs

1. [`01-vision.md`](./01-vision.md) — qué resolvemos y para quién
2. [`02-scope-mvp.md`](./02-scope-mvp.md) — qué entra al MVP, qué queda fuera
3. [`03-stack.md`](./03-stack.md) — decisiones técnicas y por qué
4. [`04-flujos.md`](./04-flujos.md) — flujos clave (cliente / profesional / admin)
5. [`05-modelo-datos.md`](./05-modelo-datos.md) — entidades y relaciones
6. [`06-rebranding.md`](./06-rebranding.md) — checklist ElectroAR → TuProfesional
7. [`07-roadmap.md`](./07-roadmap.md) — fases e hitos

## Backlog

Las tareas vivas están en [`backlog/`](./backlog/). Punto de entrada: [`backlog/README.md`](./backlog/README.md).

- [`backlog/tareas-backend.md`](./backlog/tareas-backend.md)
- [`backlog/tareas-frontend.md`](./backlog/tareas-frontend.md)
- [`backlog/tareas-producto.md`](./backlog/tareas-producto.md)

## Cómo correr todo en local

```bash
# Backend (puerto 3001 / 8080)
cd electro-ar-backend
cp .env.example .env   # completar ANTHROPIC_API_KEY, DATABASE_URL, MP_ACCESS_TOKEN, JWT_SECRET
npm install
npx prisma migrate dev
npm run dev

# Frontend (puerto 5173)
cd ../electro-ar-frontend
cp .env.example .env   # completar VITE_API_URL=http://localhost:3001
npm install
npm run dev
```
