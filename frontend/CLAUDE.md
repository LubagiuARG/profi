# Profi · Frontend

Web pública de **Profi** — plataforma argentina de presupuestos con IA y directorio de profesionales.

> Antes se llamaba **ElectroAR**. Rebranding pendiente — ver [`../docs/06-rebranding.md`](../docs/06-rebranding.md).

## Stack

React 18 · Vite 5 · React Router 6 · CSS Modules · `fetch` nativo (sin axios).

Deploy: **Vercel** (ya andando).

## Comandos

```bash
npm install
cp .env.example .env       # completar VITE_API_URL
npm run dev                # localhost:5173
npm run build              # genera /dist
npm run preview            # sirve /dist en localhost:4173
```

## Variables de entorno

```
VITE_API_URL          # URL del backend (local: http://localhost:3001)
VITE_MP_PUBLIC_KEY    # Public key MP — solo si usamos Checkout embebido (hoy redirigimos al init_point)
```

> ⚠️ **No usar `VITE_ANTHROPIC_KEY`.** El README viejo lo menciona pero está mal — la API key de Anthropic vive solo en el backend.

## Estructura

```
src/
  App.jsx                  rutas (públicas + protegidas + admin)
  main.jsx                 entry + ContextProviders
  components/
    Header / Footer        layout público
    AdBanner               placeholder para AdSense
    BuscadorGeo            input con autocompletar de localidades AR
    SelectorUbicacion      provincia + localidad + radio km
    admin/AdminLayout      shell del panel admin
  pages/
    Home                   landing pública
    Presupuesto            chat IA con Claude
    Electricistas          directorio público (renombrar a Profesionales — FE-001)
    Registro               alta de profesional + selección de plan
    Login + Panel          área autenticada del profesional
    admin/                 AdminLogin, Dashboard, Categorias, Profesionales, Admins
  context/
    AuthContext            estado del profesional logueado
    AdminContext           estado del admin logueado
  hooks/
    useChat                estado del chat (mensajes, loading, error)
  services/
    api.js                 helpers fetch contra el backend público
    adminApi.js            helpers fetch contra /api/admin
    georef.js              consultas a georef.gob.ar
    claude.js              (legacy — revisar si todavía hace falta tras pasar al backend)
  styles/
    global.css             tokens y utilidades
```

## Rutas

| Ruta | Componente | Auth |
|------|------------|------|
| `/` | Home | público |
| `/profesionales` | Electricistas (renombrar) | público |
| `/presupuesto` | Presupuesto | público |
| `/registro` | Registro | público |
| `/login` | Login | público |
| `/panel` | Panel | profesional logueado |
| `/admin` | AdminLogin | público (redirige si ya logueado) |
| `/admin/dashboard` | AdminDashboard | admin |
| `/admin/categorias` | AdminCategorias | admin |
| `/admin/profesionales` | AdminProfesionales | admin |
| `/admin/admins` | AdminAdmins | **superadmin** |

Las rutas admin no tienen `<Header />` ni `<Footer />` (App.jsx separa los Routes en bloques).

## Convenciones

- **Idioma:** español (incluyendo nombres de variables, props y archivos).
- **CSS Modules**. Un `.module.css` por componente. Nada de estilos inline salvo casos puntuales.
- **Sin TS** — JS plano. Si se complica, evaluar.
- **Sin librería de forms** — `useState` + validación manual. Sumar `react-hook-form` solo si crecen.
- **Sin librería de UI** — componentes propios. No traer Material/Chakra ahora.
- **Llamadas al backend** vía `services/api.js` — no fetch directo en componentes.

## Gotchas

1. **`README.md` desactualizado** — dice cosas obsoletas como `VITE_ANTHROPIC_KEY` y "conectar con backend" cuando ya está. Ver `FE-002`.
2. **`pages/Electricistas.jsx`** — la ruta ya es `/profesionales` pero el archivo y el componente siguen llamándose Electricistas. Renombrar en `FE-001`.
3. **`AuthContext` y `AdminContext`** son **independientes**. Un usuario puede ser ambos (profesional + admin). Login en cada uno por separado.
4. **`vercel.json`** existe pero tiene config mínima — chequear antes de cambiar dominios.
5. **`AdBanner.jsx`** es placeholder. Reemplazar por snippet real solo cuando AdSense esté aprobado (`OP-010`).
6. **Páginas admin no usan rutas anidadas** — cada una declara su propio `<AdminLayout>` adentro. No hace falta tocar `App.jsx` para sumar nuevas.

## Backlog

Las tareas concretas viven en [`../docs/backlog/tareas-frontend.md`](../docs/backlog/tareas-frontend.md).

## Docs del monorepo

[`../docs/`](../docs/) — visión, scope, modelo, flujos, rebranding, roadmap.
