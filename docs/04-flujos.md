# 04 · Flujos clave

Cada flujo describe el camino feliz + casos de error principales. Cuando hay nombres de archivo, son los que existen hoy en los repos.

---

## A. Cliente pide un presupuesto

**Actor:** cliente particular o profesional que quiere armar un presupuesto rápido.

```
┌──────────┐     POST /api/chat                   ┌──────────────────┐
│ Frontend │ ────────────────────────────────────▶│ Backend          │
│ /presup. │  { messages, userType, modo }        │ routes/chat.js   │
└──────────┘                                      └──────────────────┘
                                                     │
                                                     ▼
                                            obtenerPrecios()
                                            ┌──────────────────────┐
                                            │ leer cache/precios   │
                                            │ si vacío → scrapear  │
                                            └──────────────────────┘
                                                     │
                                                     ▼
                                            buildSystemPrompt()
                                            (inyecta tabla CMO + fecha)
                                                     │
                                                     ▼
                                            Anthropic API
                                            claude-sonnet-4-6
                                                     │
                                                     ▼
                                            JSON.parse(respuesta)
                                                     │
┌──────────┐  { texto, items[], total, notas, _meta }│
│ Frontend │◀────────────────────────────────────────┘
│ render   │
└──────────┘
```

### Detalles
- `userType: 'particular' | 'profesional'` cambia el system prompt (más detalle si es profesional).
- El backend siempre retorna `_meta.preciosActualizados` y `_meta.fuente` para que el frontend muestre cuándo fueron los últimos precios.
- Rate limit: **10 req/min** por IP en `/api/chat` — `middleware/rateLimiter.js`.
- Si Claude devuelve algo no parseable, fallback `{ texto: clean, items: [], total: '', notas: '' }`.

### Limitaciones actuales
- Solo funciona bien para **rubro electricista** — la tabla CMO solo tiene esos precios.
- Para otros rubros la respuesta será genérica y poco útil hasta que sumemos otras fuentes.

---

## B. Profesional se registra y paga PRO

```
1. Frontend /registro
   └─ Form completo + selección plan (free | pro)

2. POST /api/auth/registro
   └─ bcrypt password, prisma.electricista.create
   └─ devuelve { token, electricista }

3. (si plan === 'pro')
   POST /api/suscripciones/crear
   └─ MercadoPago PreApproval.create({
        reason: "Profi — Plan PRO",
        payer_email,
        auto_recurring: { 20000 ARS / mes },
        external_reference: electricistaId,
        back_url: FRONTEND_URL/registro?estado=aprobado
      })
   └─ devuelve { init_point }

4. Frontend redirige a init_point (sitio de MercadoPago)

5. Cliente paga en MP

6. MP llama a webhook
   POST /api/suscripciones/webhook
   └─ type === 'subscription_preapproval'
   └─ preApproval.get({ id })
   └─ si status === 'authorized':
        prisma.electricista.update({ plan: 'pro', verificado: true })
        prisma.pago.create({ ... })
   └─ si status === 'cancelled':
        prisma.electricista.update({ plan: 'free', verificado: false })

7. MP redirige al cliente a back_url
   Frontend lee query ?estado=aprobado y muestra confirmación
```

### Riesgos y huecos
- **Webhook sin verificar firma.** Cualquiera con la URL puede simular un pago. Tarea pendiente: validar `x-signature` (ver [`backlog/tareas-backend.md`](./backlog/tareas-backend.md)).
- **Sin email de confirmación.** El profesional paga y no recibe nada por mail.
- **Si el webhook llega antes de que termine `auth/registro`:** podría fallar el `update`. Hoy no es probable porque MP demora unos segundos, pero sin idempotencia.

---

## C. Cliente busca un profesional

```
1. Frontend /profesionales
   └─ Filtros: provincia, localidad, radio km, categoría, búsqueda libre

2. GET /api/electricistas?zona=...&search=...&plan=...
   └─ prisma.electricista.findMany({
        where: { activo: true, ...filtros },
        orderBy: [{ plan: 'desc' }, { rating: 'desc' }]   // PRO primero
      })

3. (Frontend) BuscadorGeo + SelectorUbicacion
   └─ georef.gob.ar para autocompletar provincia/localidad
   └─ Cálculo de distancia client-side por radio km

4. Click en perfil → muestra info pública + teléfono (si plan = PRO)
```

### Decisiones de ordenamiento
- PRO primero, después rating, después reseñas. **Esto monetiza el plan PRO** — sin destaque, no hay incentivo a pagar.
- Profesionales con `vacaciones: true` o `activo: false` no aparecen.

---

## D. Admin gestiona la plataforma

```
1. Frontend /admin → AdminLogin
   POST /api/admin/auth/login
   └─ JWT con rol 'admin' | 'superadmin'

2. /admin/dashboard
   └─ Métricas de profesionales registrados, plan PRO, pagos recientes

3. /admin/categorias
   └─ CRUD de rubros (electricista, plomero, gasista...)
   └─ Cada categoría tiene slug, emoji, descripción, orden, activa

4. /admin/profesionales
   └─ Listado con búsqueda
   └─ Aprobar/desaprobar verificación
   └─ Cambiar plan manualmente (override)

5. /admin/admins  (solo superadmin)
   └─ Crear otros admins (regulares)
```

### Notas
- El primer admin se crea con `services/seed.js` (script manual).
- No hay logs de auditoría todavía — quién cambió qué, cuándo. Tarea pendiente.

---

## E. Scraper diario de precios

```
node-cron: '0 3 * * *'  America/Argentina/Buenos_Aires
   ↓
scrapearPrecios()  (services/scraper.js)
   ↓
axios.get(SCRAPER_URL)   electroinstalador.com/p43-cmo-...
   ↓
cheerio.load(html)
   ↓
parsear filas de tablas → { items: [{ label, val }], textoPlano, actualizadoEn, fuente }
   ↓
escribir cache/precios.json
```

### Casos de error
- Si el HTML cambió y no se encuentran filas → log warning, **mantener cache anterior**.
- Si axios falla (red/timeout) → idem.
- En arranque del servidor (`server.js:121`): si no hay cache, scrapea en background — **no bloquea el healthcheck de Railway** (que tiene timeout 30s).

### Próxima evolución
- Sumar otra fuente para plomería/gasista (a definir)
- Almacenar en DB (no solo en JSON) para histórico de precios

---

## F. Conexión cliente ↔ profesional (lead matching)

**Actor:** cliente que terminó un presupuesto y quiere contratar.

```
1. Cliente termina presupuesto en /presupuesto
   └─ CTA "Contactá a un profesional con este detalle"

2. POST /api/solicitudes/sugerencias
   body: { categoriaSlug, ubicacion }
   └─ Devuelve top N pros (ordenado por: PRO primero, rating, distancia)
   └─ Hasta 3 destacados + N adicionales

3. Cliente elige hasta 3 + completa datos
   └─ Form: nombre, teléfono, email opcional, dirección aproximada, descripción extra

4. Verificación de teléfono (OTP)
   POST /api/clientes/otp/enviar     { telefono }
   └─ SMS o WhatsApp con código de 6 dígitos
   POST /api/clientes/otp/verificar  { telefono, codigo }
   └─ devuelve token corto

5. POST /api/solicitudes
   body: { token, profesionalIds[], presupuestoSnapshot, ... }
   └─ Crea N filas de Solicitud (estado: pendiente, expiraEn: +7d)
   └─ Crea o actualiza Cliente
   └─ Email a cada pro: "Nueva solicitud — DDMM"

6. Pro entra a /panel → tab "Solicitudes"
   GET /api/panel/solicitudes
   └─ Lista pendientes con preview del presupuesto

7. Pro acepta o rechaza
   PATCH /api/panel/solicitudes/:id/aceptar
     └─ Estado → 'aceptada'
     └─ Email al cliente con contacto del pro (WhatsApp click-to-chat)
     └─ Datos del cliente quedan visibles para el pro
   PATCH /api/panel/solicitudes/:id/rechazar  { motivo }
     └─ Estado → 'rechazada'
     └─ Email al cliente: "Probá con otro profesional"

8. Negociación final por WhatsApp (afuera de Profi)

9. Cualquiera de las dos partes cierra
   PATCH /api/solicitudes/:id/cerrar
     └─ Trigger: invitar al cliente a dejar reseña (BE-010)
     └─ Trigger: pedir NPS al pro
```

### Reglas de negocio
- **Plan FREE:** recibe **3 solicitudes/mes**. Solicitud 4ª en adelante cae a la cola pero no notifica.
- **Plan PRO:** ilimitado.
- **Anti-spam:** rate limit por número de teléfono (5 solicitudes/día) + límite por IP.
- **Expiración:** solicitud sin respuesta a 7 días → estado `expirada`. Cliente recibe mail "tu solicitud expiró, probá con otro pro".
- **Bypass:** asumido. El pro va a dar su WhatsApp y cerrar afuera. Métrica de éxito = solicitudes cerradas formalmente, pero la mayoría va a quedar abiertas.
- **Sugerencias:** orden por (1) plan PRO, (2) tilde azul ✓ identidad verificada, (3) rating, (4) distancia, (5) reviews count.

### Riesgos
- Pro ghost (acepta y nunca contacta) → métrica de "% de aceptadas con reseña" baja → se penaliza en ranking.
- Solicitudes falsas (boicot competencia) → mitigado por OTP y por verificación de identidad del cliente (Flujo G).
- Sobrecarga de notificaciones → digerir en mail diario en vez de uno por solicitud (PRO con muchas).

---

## G. Verificación de identidad (tilde azul)

**Actor:** cliente o profesional que quiere el badge de verificado.

```
1. Usuario en /panel → "Verificá tu identidad"
   └─ CTA grande con beneficios: ranking, confianza, badge ✓

2. Wizard 3 pasos (frontend):
   a) Foto DNI frente
   b) Foto DNI dorso
   c) Selfie con cartel manuscrito "Profi DD/MM/AAAA"

3. POST /api/verificacion/iniciar
   └─ Backend devuelve 3 pre-signed URLs de R2/S3 (privados, TTL 5 min)

4. Frontend sube directo a R2/S3 (no pasa por backend)

5. POST /api/verificacion/confirmar  { uploadIds }
   └─ Crea VerificacionIdentidad.estado = 'pendiente'
   └─ Hash del DNI extraído (chequeo de duplicados)
   └─ Email al admin: "Hay verificación pendiente"

6. Admin entra a /admin/verificaciones
   GET /api/admin/verificaciones
   └─ Lista pendientes con miniaturas (URL pre-firmada, expira 5 min)

7. Admin revisa visualmente:
   - DNI legible y no vencido
   - Selfie matchea con foto del DNI
   - Cartel con fecha del día (anti foto vieja)
   - DNI no usado por otro usuario (chequeo de hash)

8. Admin decide
   PATCH /api/admin/verificaciones/:id   { estado: 'aprobada' }
     └─ Profesional/Cliente.identidadVerificada = true
     └─ Email al usuario: "Tu identidad fue verificada ✓"
     └─ Programa borrado de imágenes a 90 días
   PATCH /api/admin/verificaciones/:id   { estado: 'rechazada', motivoRechazo }
     └─ Email al usuario con motivo
     └─ Borrar imágenes a las 24hs

9. Cron job diario
   └─ Borrar imágenes de verificaciones aprobadas hace > 90 días
   └─ DB conserva: estado, fecha, hash DNI, admin que aprobó
```

### Niveles de verificación
| Nivel | Cómo se obtiene | Quién | Badge |
|-------|----------------|-------|-------|
| Email verificado | link en mail | todos | (ninguno) |
| Teléfono verificado | OTP SMS/WA | todos | (ninguno) |
| **Identidad verificada** | DNI + selfie + admin OK | todos | **✓ azul** |
| **Matrícula verificada** | foto matrícula + cruce | solo pros | **⚡ amarillo** |

### Compliance — Ley 25.326 (datos personales AR)
- DNI = dato sensible. Almacenar mínimo necesario.
- Imágenes encriptadas at rest (default S3/R2).
- URLs siempre pre-firmadas con TTL corto. Nunca link público.
- Borrado obligatorio de imágenes a 90 días post-aprobación / 24hs post-rechazo.
- DB conserva solo metadata (estado, fecha, admin) + hash del DNI.
- Términos deben mencionar el tratamiento.
- Derecho de eliminación: usuario puede pedir borrado completo (incluye DB).

### Costo
- R2 (Cloudflare): ~USD 0.015/GB-mes — insignificante
- Tiempo admin: 2–5 min por verificación al inicio
- Cuando duela (>20/día) migrar a tercero (Didit/Veriff/Sumsub) — USD 1–3 por verif

### Evolución a tercero (fase 2)
- Reemplazar el wizard manual por SDK del proveedor.
- El proveedor hace liveness check + OCR del DNI + match facial automáticamente.
- Webhook nos avisa el resultado.
- Admin solo interviene en casos dudosos.
