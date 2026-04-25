# Backlog · Backend

> Convención: `🔴 P0` bloqueante MVP · `🟠 P1` importante · `🟡 P2` mejora · `🟢 P3` nice to have · `🐛` inconsistencia detectada en código.

## 🔴 P0 — Bloqueantes del MVP

### `BE-001` 🐛 Verificar firma del webhook de MercadoPago
- **Dónde:** `routes/suscripciones.js:73`
- **Problema:** El webhook acepta cualquier POST sin validar que venga realmente de MP. Cualquiera con la URL puede simular un pago aprobado y obtener Plan PRO gratis.
- **Qué hacer:**
  - Implementar validación de header `x-signature` y `x-request-id` según [docs de MP](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks).
  - HMAC-SHA256 con `MP_WEBHOOK_SECRET` (nueva env var) sobre `id;request-id;ts`.
  - Devolver 401 si la firma no matchea, antes de tocar la DB.
- **Tests:** simular request con firma válida, inválida, y sin firma.

### `BE-002` 🐛 Unificar montos de plan PRO
- **Dónde:** `routes/suscripciones.js:16` (`$20.000`) vs `routes/electricistas.js:146` (`$8.900`).
- **Problema:** Si alguien dispara el endpoint legacy `PATCH /api/electricistas/:id/plan`, registra un pago a $8.900 — es un monto antiguo que quedó hardcoded.
- **Qué hacer:**
  - Centralizar el monto en una constante `PLAN_PRO_MONTO_ARS` (mejor en una tabla `Plan` en DB).
  - Borrar la rama hardcoded de `electricistas.js:142-151` o redirigirla al flujo de MP.

### `BE-003` Renombrar prompts/textos de "ElectroAR" en backend
- **Dónde:** `routes/chat.js:54`, `routes/suscripciones.js:17`, `server.js:113-117`.
- **Por qué P0:** afecta lo que ven clientes finales (texto de Claude, descripción de la suscripción en MP).
- **Qué hacer:** reemplazar "ElectroAR" → "Profi" en todos los strings user-facing. NO renombrar todavía la tabla `Electricista` ni rutas (eso es P1).

### `BE-004` Multi-rubro en `/api/chat`
- **Dónde:** `routes/chat.js`
- **Problema:** El prompt asume rubro electricista. Si un cliente pregunta por una pérdida de gas o pintura, devuelve respuesta incoherente con la tabla CMO.
- **Qué hacer:**
  - El frontend pasa `categoriaSlug` (electricista, plomero, gasista...) en el body.
  - El backend selecciona el dataset de precios + system prompt correspondiente.
  - Para los rubros sin tabla, system prompt genérico que aclare "precios orientativos sin tabla oficial".

### `BE-005` Email transaccional mínimo
- **Por qué P0:** un profesional que paga $20.000 sin recibir mail asume que algo salió mal.
- **Qué hacer:**
  - Integrar Resend o Mailgun (free tier alcanza).
  - Templates: bienvenida tras registro, confirmación de pago tras webhook, recuperar contraseña.
  - Variable `EMAIL_API_KEY` y `EMAIL_FROM`.

### `BE-006` Logging estructurado + error tracking
- **Por qué P0:** si rompe en prod, hoy ni nos enteramos.
- **Qué hacer:**
  - Reemplazar `console.log/error` por un logger pequeño (`pino`).
  - Integrar Sentry o BetterStack para errores 500.
  - Variable `SENTRY_DSN`.

---

## 🟠 P1 — Importantes post-MVP

### `BE-010` Endpoints de reseñas (`/api/resenas`)
- **Por qué:** modelo `Resena` existe pero sin rutas.
- **Endpoints:**
  - `POST /api/resenas` — crea reseña (rate-limited, captcha o token corto desde la página del profesional)
  - `GET /api/profesionales/:id/resenas` — listado público
  - Trigger en `create` que actualiza `Electricista.rating` y `.reviews`.

### `BE-011` Tracking real de visitas
- **Por qué:** `Electricista.visitas` existe pero nadie lo incrementa.
- **Qué hacer:**
  - `POST /api/profesionales/:id/visita` (idempotente por sesión, evitar contar refresh).
  - Endpoint público (no requiere auth).
  - Considerar tabla `EventoPerfil` para tener histórico, no solo contador.

### `BE-012` Login con Google (OAuth)
- **Dónde:** schema ya tiene `googleId String? @unique`.
- **Qué hacer:**
  - Endpoint `POST /api/auth/google` que recibe el `idToken` del frontend.
  - Verificar contra Google, crear o linkear cuenta.
  - JWT propio como respuesta (mismo flujo que login actual).

### `BE-013` Renombrar `Electricista` → `Profesional`
- **Dónde:** `prisma/schema.prisma`, todas las rutas, todos los `prisma.electricista.*`.
- **Riesgo:** cambio grande, una sola PR si se hace bien (usar `@map` para no obligar a renombrar la tabla en DB en el primer paso).
- **Estrategia:** ver [`06-rebranding.md`](../06-rebranding.md).

### `BE-014` Alias `/api/profesionales` → `/api/electricistas`
- **Por qué:** preparar el rebranding sin romper frontend.
- **Qué hacer:** copiar el router de electricistas y exponerlo también bajo `/api/profesionales`. Marcar `electricistas` como deprecated en logs.

### `BE-015` Tests automatizados básicos
- **Por qué:** ya hay deuda — un test de regresión por cada bug que arreglemos.
- **Stack sugerido:** `vitest` o `node:test` (sin frameworks pesados). Supertest para HTTP.
- **Cobertura mínima:** auth (registro/login), crear suscripción, parser del scraper.

### `BE-016` 🐛 `JWT_SECRET` no debe tener default
- **Dónde:** `middleware/auth.js` y `routes/auth.js:112` usan `process.env.JWT_SECRET || 'electro-ar-secret-key'`.
- **Riesgo:** si alguien deploya sin configurarlo, los tokens son fáciles de falsificar.
- **Qué hacer:** crashear el servidor en startup si la var no está seteada.

### `BE-017` Idempotencia del webhook MP
- **Problema:** MP puede reintentar el mismo evento. Hoy crearíamos varias filas en `Pago` por el mismo pago.
- **Qué hacer:** chequear `mpPaymentId` antes de crear el `Pago`. Si ya existe, devolver 200 sin tocar DB.

---

## 🟡 P2 — Mejoras

### `BE-020` Logs de auditoría para acciones admin
Tabla `AuditoriaAdmin` con `adminId, accion, recursoTipo, recursoId, datosAntes, datosDespues, fecha`.

### `BE-021` Histórico de precios scrapeados
Hoy `cache/precios.json` se sobrescribe. Guardar en DB los snapshots para poder ver tendencias.

### `BE-022` Multi-fuente de precios (un scraper por rubro)
Refactor de `services/scraper.js` para soportar varios scrapers registrados por categoría. Ver [`04-flujos.md`](../04-flujos.md).

### `BE-023` Modelo `Suscripcion` independiente de `Pago`
Hoy el "estado de la suscripción" se infiere del último pago. Mejor tabla dedicada con `mpPreapprovalId`, `estado`, `proximaFactura`, etc.

### `BE-024` Health check más rico
`/health` hoy solo devuelve `{ ok: true }`. Sumar: estado del cache de precios, ping a la DB, último cron exitoso.

### `BE-025` Rate limit por usuario, no solo por IP
Para `/api/chat`, una vez que tenemos auth opcional, contar por `electricistaId` cuando esté logueado.

### `BE-026` Compactación de JSON de Claude
Hoy se parsea con `try/catch`. Sumar `response_format` o tool calling para forzar JSON válido y ahorrar tokens.

---

## 🟢 P3 — Nice to have

- `BE-030` Endpoint `/api/categorias/:slug/precios` para que el frontend muestre la tabla CMO entera.
- `BE-031` Webhook a Slack/Discord cuando se registra un nuevo PRO.
- `BE-032` Backup automático de la DB a S3 (Railway tiene backups pero un segundo nivel no hace mal).
- `BE-033` GraphQL endpoint (probablemente NO — over-engineering para esta etapa).

---

## 🔴 P0 — Bloqueantes del MVP (lead matching y verificación)

### `BE-040` Modelo + endpoints de Solicitud (lead matching)
- **Por qué P0:** corazón de la conexión cliente↔profesional. Sin esto, Profi es solo un directorio + chat.
- **Schema nuevo:** `Solicitud` (ver [`05-modelo-datos.md`](../05-modelo-datos.md)).
- **Endpoints:**
  - `POST /api/solicitudes/sugerencias` → top N pros para un presupuesto + ubicación
  - `POST /api/solicitudes` → crea solicitud(es) con token OTP
  - `GET /api/panel/solicitudes` → lista del pro autenticado
  - `PATCH /api/panel/solicitudes/:id/aceptar`
  - `PATCH /api/panel/solicitudes/:id/rechazar` `{ motivo }`
  - `PATCH /api/solicitudes/:id/cerrar`
- **Reglas:**
  - Orden de sugerencias: PRO → identidad ✓ → rating → distancia → reviews
  - Cliente puede mandar a hasta 3 pros simultáneos
  - Expiración 7 días sin respuesta
  - Anti-spam: rate limit por teléfono (5/día) e IP

### `BE-041` OTP por SMS/WhatsApp para clientes
- **Por qué:** el cliente no se loguea con password — verifica teléfono y crea solicitud. OTP es la barrera anti-spam mínima.
- **Endpoints:**
  - `POST /api/clientes/otp/enviar` `{ telefono }` — manda código 6 dígitos, TTL 10 min
  - `POST /api/clientes/otp/verificar` `{ telefono, codigo }` → token corto (TTL 30 min)
- **Provider:** Twilio o WhatsApp Cloud API (free tier 1000/mes inicial — preferido).
- **Tabla nueva:** `OtpCliente { telefono, codigoHash, intentos, expiraEn }`.
- **Vars:** `TWILIO_*` o `WA_TOKEN` + `WA_PHONE_ID`.

### `BE-042` Modelo Cliente
- **Schema nuevo:** `Cliente` (ver [`05-modelo-datos.md`](../05-modelo-datos.md)).
- **Notas:**
  - Sin password — auth solo por OTP por ahora
  - `telefono` es la PK lógica (unique)
  - Se crea o actualiza implícitamente al verificar OTP

### `BE-043` Modelo + endpoints de VerificacionIdentidad (manual)
- **Por qué P0:** confianza es lo que diferencia Profi de un grupo de WhatsApp.
- **Schema nuevo:** `VerificacionIdentidad` (polimórfico cliente/pro).
- **Endpoints:**
  - `POST /api/verificacion/iniciar` → 3 pre-signed URLs R2/S3 (TTL 5 min)
  - `POST /api/verificacion/confirmar` `{ uploadIds }` → crea fila estado `pendiente`
  - `GET /api/verificacion/estado` → estado del usuario actual
  - `GET /api/admin/verificaciones?estado=pendiente`
  - `PATCH /api/admin/verificaciones/:id` `{ estado, motivoRechazo }`
- **Cuando se aprueba:** flag `identidadVerificada = true` en Cliente o Profesional + email + programar borrado de imágenes a 90d.
- **Anti-fraude:** chequeo de `dniHash` duplicado (un DNI = una persona).

---

## 🟠 P1 — Importantes post-MVP (lead/verificación)

### `BE-044` Storage R2/S3 + pre-signed URLs
- **Por qué:** las imágenes de verificación no pueden vivir en el server.
- **Provider:** Cloudflare R2 (sin egress fees, USD 0.015/GB-mes). Alternativa AWS S3.
- **Vars:** `R2_BUCKET`, `R2_ACCESS_KEY`, `R2_SECRET`, `R2_ENDPOINT`.
- **SDK:** `@aws-sdk/client-s3` (R2 es S3-compatible).
- **Bucket privado, encriptación at rest.**

### `BE-045` Email templates: solicitudes y verificación
- **Templates nuevos:**
  - `solicitud-nueva` — al pro cuando llega una
  - `solicitud-aceptada` — al cliente con contacto del pro
  - `solicitud-rechazada` — al cliente con sugerencia de probar otro
  - `solicitud-expirada` — al cliente
  - `verificacion-aprobada` — usuario verificado
  - `verificacion-rechazada` — usuario con motivo

### `BE-046` Cron de borrado de imágenes (90 días)
- **Por qué:** Ley 25.326 — guardar mínimo necesario.
- **Cron diario:** borrar archivos R2 de verificaciones aprobadas hace > 90 días.
- **Borrado inmediato (24hs):** de verificaciones rechazadas.
- **DB conserva:** estado, fecha, admin que aprobó, hash DNI. NO conserva las imágenes.

### `BE-048` Limitar leads por plan
- **Por qué:** monetización — el FREE tiene que sentir el techo.
- **Schema:** sumar `Profesional.solicitudesUsadasMes` + `solicitudesResetEn`.
- **Lógica:** al crear `Solicitud` con destino FREE, chequear contador. Si llegó a 3 → encolar (estado `pendiente_cola`) sin notificar.
- **Reset:** cron mensual a las 00:00 del día 1.

---

## 🟡 P2 — Mejoras (lead/verificación)

### `BE-047` Migrar verificación a proveedor KYC
- **Cuando:** volumen > 20 verifs/día — el tiempo de admin se vuelve el cuello de botella.
- **Candidatos AR-friendly:** Didit, Veriff, Sumsub, Persona.
- **Costo:** ~USD 1–3 por verificación.
- **Beneficio:** liveness real anti-deepfake, OCR del DNI automático, decisión en minutos.
- **Implementación:** SDK del proveedor en frontend + webhook al backend con resultado.

---

## Hechas

(vacío)
