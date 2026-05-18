# TuProfesional — Frontend

Web pública de **TuProfesional** — plataforma argentina de presupuestos con IA y directorio de profesionales (electricistas, plomeros, gasistas, pintores, etc.).

Para detalles de stack, estructura y convenciones internas ver [`CLAUDE.md`](./CLAUDE.md).

## Cómo arranca

```bash
npm install
cp .env.example .env       # completar VITE_API_URL
npm run dev                # localhost:5173
```

## Variables de entorno

```env
VITE_API_URL=http://localhost:3001   # URL del backend de TuProfesional
VITE_MP_PUBLIC_KEY=APP_USR-...       # opcional — solo si usás Checkout embebido
```

> ⚠️ **La API key de Anthropic vive solo en el backend.** Cualquier referencia a `VITE_ANTHROPIC_KEY` en este repo es legacy y debe ignorarse — exponerla en el frontend es un riesgo de seguridad.

## Stack

React 18 · Vite 5 · React Router 6 · CSS Modules · `fetch` nativo (sin axios). Sin TS por ahora. Sin librería de UI — componentes propios.

## Rutas

| Ruta | Componente | Auth |
|------|------------|------|
| `/` | Home | público |
| `/profesionales` | Profesionales | público |
| `/presupuesto` | Presupuesto (chat IA) | público |
| `/registro` | Registro | público |
| `/login` | Login | público |
| `/panel` | Panel | profesional JWT |
| `/admin` | AdminLogin | público |
| `/admin/dashboard` | AdminDashboard | admin |
| `/admin/categorias` | AdminCategorias | admin |
| `/admin/profesionales` | AdminProfesionales | admin |
| `/admin/admins` | AdminAdmins | **superadmin** |

Las páginas admin no usan `<Header />` ni `<Footer />` (App.jsx separa los Routes en bloques).

## Build

```bash
npm run build        # genera /dist
npm run preview      # sirve /dist en localhost:4173
```

Deploy va a **Vercel** desde el root del repo apuntando a `frontend/`. `VITE_API_URL` se setea en el panel.

## Backlog

Las tareas concretas viven en [`../docs/backlog/tareas-frontend.md`](../docs/backlog/tareas-frontend.md).
