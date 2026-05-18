# TuProfesional — Backend

API REST + scraper automático de precios CMO para **TuProfesional**, plataforma argentina de presupuestos con IA y directorio de profesionales (electricistas, plomeros, gasistas, pintores, etc.).

Para detalles de stack, comandos y convenciones internas ver [`CLAUDE.md`](./CLAUDE.md).

## Cómo arranca

```bash
npm install
cp .env.example .env             # completar los valores
npx prisma migrate dev           # aplicar migraciones contra DATABASE_URL
node services/seed.js            # crear categorías + admin inicial

npm run dev                      # puerto 3001 (o el de PORT)
```

Variables obligatorias para que arranque: `DATABASE_URL`, `JWT_SECRET` (el server crashea al inicio si falta alguna).

## Cómo funciona el scraper

1. Al arrancar, si no hay `cache/precios.json` scrapea en segundo plano la página CMO de electroinstalador.com.
2. Cron diario a las **3:00am (Argentina)** vuelve a scrapear.
3. Cada consulta a `/api/chat` con rubro `profesional` (electricista) inyecta esos precios al system prompt.
4. Otros rubros (plomero, gasista, pintor…) usan un prompt genérico — todavía no hay tabla oficial. Ver `BE-022` (multi-fuente) en el backlog.

## Endpoints

| Método | Ruta | Auth | Qué hace |
|--------|------|------|----------|
| `GET`  | `/health` | público | Estado del servidor |
| `POST` | `/api/chat` | público | Presupuesto IA (acepta `categoriaSlug`) |
| `GET`  | `/api/precios/estado` | público | Estado del cache de precios |
| `GET`  | `/api/precios/datos` | público | Tabla CMO cacheada |
| `POST` | `/api/precios/actualizar` | `x-admin-token` | Scraping manual |
| `GET`  | `/api/categorias` | público | Listado de rubros activos |
| `GET`  | `/api/profesionales` | público | Directorio con filtros |
| `POST` | `/api/auth/registro` | público | Alta de profesional |
| `POST` | `/api/auth/login` | público | Login profesional |
| `GET`  | `/api/auth/me` | JWT pro | Perfil propio |
| `POST` | `/api/suscripciones/crear` | público | Inicia PreApproval MP |
| `POST` | `/api/suscripciones/webhook` | firma MP | Webhook MP (HMAC-SHA256) |
| `POST` | `/api/admin/auth/login` | público | Login admin |
| `*`    | `/api/admin/*` | JWT admin | Gestión admin |

### Ejemplo: presupuesto IA para plomero

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Reparar pérdida en el baño"}],
    "userType": "particular",
    "categoriaSlug": "plomero"
  }'
```

## Despliegue

Va a **Railway** desde el root del repo apuntando a `backend/`. Las variables se setean en el panel — `JWT_SECRET` y `DATABASE_URL` son obligatorias. Para que los webhooks de MP en prod no se rechacen, también seteá `MP_WEBHOOK_SECRET` (sacalo del panel MP → Webhooks → "Clave secreta").

## Seguridad implementada

- Helmet + CORS whitelist + rate limit (100/15min global, 10/min `/api/chat`).
- JWT obligatorio (sin default, crashea si falta).
- Firma HMAC-SHA256 en webhook MP (rechaza 401 si no matchea o falta el secret en prod).
- Idempotencia por `mpPaymentId` para evitar pagos duplicados.

## Backlog

Las tareas concretas viven en [`../docs/backlog/tareas-backend.md`](../docs/backlog/tareas-backend.md).
