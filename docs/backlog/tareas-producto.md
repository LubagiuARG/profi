# Backlog · Producto / Operaciones

Cosas que no son código pero que el MVP necesita igual.

> Convención: `🔴 P0` bloqueante MVP · `🟠 P1` importante · `🟡 P2` mejora · `🟢 P3` nice to have.

## 🔴 P0 — Bloqueantes del MVP

### `OP-001` Comprar dominio
- Opciones: `profi.com.ar` (preferido), `usaprofi.com`, `holaprofi.com.ar`.
- Una vez comprado: configurar DNS en Vercel (frontend) y opcional subdominio `api.` para Railway.

### `OP-002` Términos y condiciones + política de privacidad
- **Por qué:** legal en Argentina (Ley 25.326 protección de datos), requisito de AdSense, requisito de MercadoPago para usar PreApproval.
- **Cómo:** plantilla base + adaptar. Si tenemos presupuesto, abogado.

### `OP-003` Cuenta de email transaccional
- Dominio configurado con SPF/DKIM/DMARC.
- Cuenta `noreply@profi.com.ar`.
- Provider: Resend (free 3k/mes), Mailgun, Brevo.

### `OP-004` Logo + branding básico
- Logo Profi (vector SVG).
- Favicon.
- OG image (1200x630, lo que se ve cuando se comparte el link).
- Paleta de colores definida en `global.css` con tokens.

### `OP-005` Texto/copy de cada página revisado
- Home (hero, secciones, CTA)
- "Cómo funciona" (FE-004)
- Registro (claridad de planes free/PRO)
- Términos / Privacidad (OP-002)

### `OP-006` Cuenta de MercadoPago lista para producción
- Verificar que el `MP_ACCESS_TOKEN` sea de **producción** (no sandbox).
- Crear el "Plan PRO" si MP requiere preregistrarlo.
- Configurar URL de webhook en el panel de MP apuntando a `api.profi.com.ar/api/suscripciones/webhook`.

### `OP-007` Plan de soporte mínimo
- Dirección de contacto pública (mail + WhatsApp Business).
- Horario de respuesta declarado en términos (ej. 48hs hábiles).

---

## 🟠 P1 — Importantes post-MVP

### `OP-010` Aplicar a Google AdSense
- **Pre-requisito:** dominio propio + tráfico mínimo + términos publicados + página "Sobre nosotros" o "Contacto".
- **Cuando aprueben:** reemplazar el contenido placeholder de `AdBanner.jsx` con el snippet real.

### `OP-011` Estrategia de adquisición de profesionales
- Lista de gremios / consejos profesionales por rubro y provincia.
- Mensaje de outreach (mail / WhatsApp) para sumar primeros usuarios.
- Mes gratis de PRO para los primeros N profesionales (gancho lanzamiento).

### `OP-012` SEO básico
- `robots.txt` y `sitemap.xml` (FE).
- Meta tags + Open Graph en cada página.
- Google Search Console con el dominio verificado.

### `OP-013` Analytics
- Google Analytics 4 o Plausible (más simple, sin cookies).
- Eventos clave: `presupuesto_solicitado`, `pro_perfil_visto`, `click_telefono`, `registro_iniciado`, `registro_completado`, `pago_pro_completado`.

### `OP-014` Política de moderación de profesionales
- Criterios para aprobar / rechazar verificación.
- Qué hacer si un cliente reporta a un profesional.

### `OP-015` Plan de contingencia para scraper roto
- Si el HTML de electroinstalador.com cambia: a quién avisa el sistema, en cuánto tiempo se arregla.
- Bandera manual para mostrar precios "posiblemente desactualizados".

---

## 🟡 P2 — Mejoras

### `OP-020` Página "Sobre nosotros" / "Equipo"
Genera confianza para clientes y profesionales.

### `OP-021` Blog / centro de ayuda
SEO + valor educativo (artículos del estilo "¿Cuánto cuesta cambiar un tablero?").

### `OP-022` Programa de referidos para profesionales
"Invitá a otro pro y ganás un mes gratis."

### `OP-023` Pricing page dedicada
Hoy el pricing está embebido en `Registro.jsx`. Como SEO, es mejor una `/precios` propia.

---

## 🟢 P3 — Nice to have

- `OP-030` Newsletter para clientes ("X cosas que un electricista debería revisar antes de mudarte")
- `OP-031` Casos de éxito en home (testimonios de pros que están facturando bien)
- `OP-032` Verificación de matrícula automática vía API del consejo profesional (cuando exista)

---

## 🔴 P0 — Bloqueantes del MVP (lead/verificación)

### `OP-040` Términos y privacidad con tratamiento de DNI/biometría
- **Por qué P0:** Ley 25.326 + bloquea verificación.
- **Qué incluir:**
  - Qué datos se recolectan (nombre, contacto, DNI, foto facial)
  - Finalidad: verificación de identidad voluntaria
  - Tiempo de retención: imágenes 90 días post-aprobación, 24hs post-rechazo
  - Derechos ARCO (acceso, rectificación, cancelación, oposición)
  - Cómo solicitar eliminación (email a `privacidad@profi.com.ar`)
  - Mención de almacenamiento en R2 (Cloudflare) o S3 con encriptación at rest
- **Cómo:** plantilla base de la AAIP (Agencia Argentina de Acceso a la Información Pública) + adaptar.
- **Idealmente:** revisión por abogado.

### `OP-041` Cuenta de OTP para clientes (Twilio o WhatsApp Cloud API)
- **Por qué:** sin OTP no podemos crear solicitudes con anti-spam mínimo.
- **Recomendación:** **WhatsApp Cloud API** (Meta) — 1000 conversaciones/mes free, mucho más entregable que SMS en AR.
- **Pasos:**
  1. Crear app en developers.facebook.com
  2. Verificar número de WA Business (`+54...`)
  3. Generar token permanente
  4. Aprobar template `otp_profi` ("Tu código de Profi: {{1}}")
- **Plan B (SMS):** Twilio AR — ~USD 0.05/SMS, sin templates.

---

## 🟠 P1 — Importantes post-MVP (lead/verificación)

### `OP-042` Cuenta Cloudflare R2 (o AWS S3) con bucket privado
- **Por qué:** storage de imágenes de verificación.
- **Recomendado:** R2 — sin egress fees + más barato que S3.
- **Setup:**
  - Crear bucket `profi-verificaciones` (privado)
  - Generar Access Key con scope al bucket
  - Configurar lifecycle rule: borrar a los 90 días (defensa en profundidad sobre el cron del backend)
- **Vars al backend:** `R2_BUCKET`, `R2_ACCESS_KEY`, `R2_SECRET`, `R2_ENDPOINT`.

### `OP-043` Política de moderación de verificaciones
- **Documento interno** (puede ir en `profi-docs/operaciones.md` futuro).
- **Criterios para aprobar:**
  - DNI legible (no borroso, no recortado)
  - DNI no vencido
  - Selfie matchea con foto del DNI
  - Cartel manuscrito con fecha del día (anti foto vieja)
  - DNI no usado por otra cuenta (chequeo de `dniHash`)
- **Ejemplos visuales** de aprobado/rechazado.
- **SLA interno:** revisar pendientes en máximo 48hs hábiles.

### `OP-044` Investigar proveedor KYC para fase 2
- **Por qué:** preparar el switch antes de que el volumen lo exija.
- **Candidatos AR:**
  - **Didit** (LATAM-friendly, USD ~1.5)
  - **Veriff** (top global, USD ~2-3)
  - **Sumsub** (compliance fuerte)
  - **Persona** (modular)
- **Comparar:** costo, idioma soportado, integración (SDK web/mobile), tiempo medio de respuesta, soporte legal AR.

---

## Hechas

(vacío)
