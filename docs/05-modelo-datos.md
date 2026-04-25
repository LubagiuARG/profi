# 05 · Modelo de datos

Refleja `electro-ar-backend/prisma/schema.prisma`. **Si cambia el schema, actualizar este doc.**

## Diagrama

```
┌─────────────────┐         ┌──────────────┐
│ Electricista    │ N ──── 1│ Categoria    │
│ (Profesional)   │         │              │
└─────────────────┘         └──────────────┘
        │ 1
        │
        │ N
        ▼
┌──────────┐    ┌──────────┐
│ Pago     │    │ Resena   │
└──────────┘    └──────────┘

┌──────────┐
│ Admin    │   (independiente)
└──────────┘
```

## Entidades

### `Electricista` (en realidad es un *Profesional* — pendiente de renombrar)

Es el corazón del modelo: cada profesional registrado.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | int autoincrement | PK |
| `nombre`, `apellido` | string | obligatorios |
| `email` | string unique | login |
| `password` | string? | hash bcrypt — null si entró por Google (sin implementar) |
| `googleId` | string? unique | OAuth Google — pendiente |
| `telefono` | string | obligatorio, contacto del cliente |
| `matricula` | string? | número de matrícula del consejo profesional |
| `provincia`, `zona` | string | localización amplia |
| `localidad`, `localidadId` | string? | de georef.gob.ar (más fino que `zona`) |
| `radioKm` | int? default 20 | radio de cobertura |
| `descripcion` | string? | bio del perfil |
| `especialidades` | string[] | tags libres |
| `categoriaId` | int? FK → Categoria | rubro principal |
| `plan` | string default `'free'` | `'free'` \| `'pro'` |
| `verificado` | bool default `false` | matrícula validada por admin |
| `activo` | bool default `true` | soft delete |
| `vacaciones` | bool default `false` | oculta del listado público |
| `rating` | float default 0 | promedio reseñas |
| `reviews` | int default 0 | conteo |
| `visitas` | int default 0 | tracker — sin hookear todavía |
| `creadoEn`, `actualizadoEn` | datetime | audit |

**Relaciones:** `pagos[]`, `resenas[]`, `categoria` (opcional).

### `Categoria` (rubro/oficio)

Lista controlada de oficios. Hoy probablemente tiene electricista; hay que sumar plomero, gasista, pintor, etc.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | int | PK |
| `nombre` | string | "Electricista", "Plomero" |
| `slug` | string unique | "electricista", "plomero" — para URLs |
| `emoji` | string | emoji para UI |
| `descripcion` | string? | una línea para SEO/listado |
| `activa` | bool default true | hideable sin borrar |
| `orden` | int default 0 | orden manual en el listado |
| `creadoEn` | datetime | |

**Relaciones:** `profesionales[]`.

### `Admin`

Administradores de la plataforma. Independiente del modelo de profesional.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id`, `nombre`, `email`, `password` | obligatorios | bcrypt |
| `rol` | string default `'admin'` | `'admin'` \| `'superadmin'` |
| `activo` | bool default true | |
| `ultimoLogin` | datetime? | |

> Solo `superadmin` puede crear otros admins (`/admin/admins`).

### `Pago`

Registra cada pago aprobado de MercadoPago.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | int | PK |
| `electricistaId` | int FK | a quién corresponde |
| `monto` | float | en ARS |
| `estado` | string default `'pendiente'` | `'pendiente'` \| `'aprobado'` \| `'rechazado'` |
| `mpPaymentId` | string? | id devuelto por MP |
| `creadoEn` | datetime | |

⚠️ **Inconsistencia:** hoy se registran pagos en dos lugares con montos distintos:
- `routes/suscripciones.js` → $20.000 (correcto, es el plan PRO)
- `routes/electricistas.js:146` → $8.900 (legacy hardcoded)

A unificar — ver backlog.

### `Resena`

Modelo definido pero **sin implementar** (no hay rutas ni UI).

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | int | PK |
| `electricistaId` | int FK | |
| `autor` | string | nombre del cliente que reseña |
| `rating` | int 1-5 | a validar |
| `comentario` | string? | |
| `creadoEn` | datetime | |

## Entidades nuevas (planificadas, no implementadas)

Estas entidades vienen con las features de **lead matching** y **verificación de identidad**. Ver [`04-flujos.md`](./04-flujos.md) flujos F y G.

### `Cliente` (NUEVO)

Hoy el cliente que pide presupuesto es anónimo. Para conectarlo con un pro necesitamos guardar contacto + permitir verificación.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | int | PK |
| `nombre` | string | obligatorio |
| `telefono` | string unique | normalizado +54..., verificado por OTP |
| `email` | string? | opcional |
| `identidadVerificada` | bool default false | tilde azul |
| `identidadVerificadaEn` | datetime? | |
| `creadoEn` | datetime | |

**Relaciones:** `solicitudes[]`.

> Cliente NO tiene password. Se autentica por OTP cada vez que pide solicitud (o token corto JWT con TTL 7d). Si crece, evaluar password.

### `Solicitud` (NUEVO) — el "lead"

Conexión entre cliente y profesional con detalle del trabajo.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | int | PK |
| `clienteId` | int? FK → Cliente | null si es cliente anónimo (legacy) |
| `clienteNombre` | string | copia, persiste aunque cliente se borre |
| `clienteTelefono` | string | verificado por OTP |
| `clienteEmail` | string? | opcional |
| `profesionalId` | int FK → Profesional | a quién va dirigida |
| `categoriaId` | int FK → Categoria | rubro del trabajo |
| `presupuestoSnapshot` | json | `{ texto, items, total, notas }` del chat IA |
| `mensajeExtra` | string? | qué agrega el cliente al detalle |
| `ubicacion` | json? | `{ provincia, localidad, lat, lng }` |
| `estado` | string default `'pendiente'` | `pendiente` \| `aceptada` \| `rechazada` \| `expirada` \| `cerrada` |
| `motivoRechazo` | string? | si el pro rechaza |
| `creadoEn` | datetime | |
| `respondidoEn` | datetime? | aceptada/rechazada |
| `cerradoEn` | datetime? | trabajo cerrado |
| `expiraEn` | datetime | `creadoEn + 7d` |

**Índices:** `(profesionalId, estado)` y `(clienteTelefono)`.

### `VerificacionIdentidad` (NUEVO)

Cola de verificaciones. Polimórfica (cliente o profesional).

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | int | PK |
| `clienteId` | int? FK | uno de los dos es no-null |
| `profesionalId` | int? FK | uno de los dos es no-null |
| `estado` | string default `'pendiente'` | `pendiente` \| `aprobada` \| `rechazada` \| `expirada` |
| `motivoRechazo` | string? | |
| `dniFrenteUrl` | string | URL R2/S3 — se borra a los 90d |
| `dniDorsoUrl` | string | idem |
| `selfieUrl` | string | idem |
| `dniHash` | string? | hash SHA-256 del nro DNI — para detectar duplicados |
| `revisadoPorId` | int? FK → Admin | quién aprobó/rechazó |
| `revisadoEn` | datetime? | |
| `creadoEn` | datetime | |

**Índices:** `(estado)` y `(dniHash)` (detectar 2 cuentas con mismo DNI).

### Campos a sumar en modelos existentes

**`Profesional`** (ex `Electricista`):
- `identidadVerificada Boolean @default(false)` — tilde azul ✓
- `identidadVerificadaEn DateTime?`

**`Cliente`** (entidad nueva):
- ya incluye `identidadVerificada` arriba

> **Decisión clave:** la verificación de identidad es voluntaria (no bloquea registrar/contratar) pero da beneficios — mejor ranking para pros, más confianza para clientes.

---

## Cambios pendientes en el schema (otros)

1. **Renombrar modelo** `Electricista` → `Profesional`. Trabajo grande, ver [`06-rebranding.md`](./06-rebranding.md). Tarea: `BE-013`.
2. **Agregar `passwordResetToken`** + `passwordResetExpires` para "olvidé mi contraseña".
3. **Agregar tabla `EventoPerfil`** para tracking real de visitas/clicks (no solo contador). Tarea: `BE-011`.
4. **Agregar tabla `Suscripcion`** para no derivar estado de la última fila de `Pago`. Tarea: `BE-023`.
5. **Agregar `Categoria.fuentePrecios`** (URL del scraper) para multi-rubro real. Tarea: `BE-022`.
6. **Agregar `Profesional.solicitudesUsadasMes`** + `solicitudesResetEn` para limitar leads de FREE. Tarea: `BE-048`.
