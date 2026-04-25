# Backlog · Frontend

> Convención: `🔴 P0` bloqueante MVP · `🟠 P1` importante · `🟡 P2` mejora · `🟢 P3` nice to have · `🐛` inconsistencia detectada en código.

## 🔴 P0 — Bloqueantes del MVP

### `FE-001` Rebranding cosmético completo
- **Por qué:** la UI todavía dice ElectroAR en muchos lados.
- **Qué cambiar:**
  - `package.json` `name`
  - `index.html` `<title>` y meta description
  - Hero de `Home.jsx` y copy
  - Header (logo)
  - Footer (créditos)
  - Página `Registro.jsx` ("Sumate a ElectroAR")
  - Renombrar `pages/Electricistas.jsx` → `pages/Profesionales.jsx` y la ruta `/profesionales` (ya existe esa ruta, solo cambiar el componente)
- **Checklist completo:** [`06-rebranding.md`](../06-rebranding.md).

### `FE-002` 🐛 README desactualizado y confuso
- **Dónde:** `electro-ar-frontend/README.md`
- **Problema:**
  - Dice "conectar con backend" como TODO cuando ya está hecho.
  - Menciona `VITE_ANTHROPIC_KEY` — **es un riesgo de seguridad** si un colaborador nuevo lo configura y deploya.
- **Qué hacer:** reescribir desde cero. Remover toda referencia a usar Anthropic desde el frontend.

### `FE-003` Pasar el rubro al chat de presupuestos
- **Dónde:** `pages/Presupuesto.jsx` + `services/api.js` (o `claude.js`).
- **Por qué:** el backend va a aceptar `categoriaSlug` (BE-004). El frontend debe enviarlo.
- **UX propuesto:** selector arriba del chat ("¿Para qué rubro?") con las categorías cargadas desde `/api/categorias`.

### `FE-004` Página de "cómo funciona"
- **Por qué:** los clientes que llegan por SEO no entienden qué es Profi sin explicación.
- **Contenido:** 3 pasos para clientes (pedir presupuesto / encontrar pro / contratar) + 3 pasos para profesionales (registro / pagar PRO / recibir consultas).

### `FE-005` Términos y privacidad (páginas)
- **Por qué:** legal + AdSense.
- **Qué hacer:** rutas `/terminos` y `/privacidad` con texto plano. Linkearlos desde el footer.

### `FE-006` Estados de carga y error consistentes
- **Por qué:** hoy `App.jsx:21` usa `<div style={{ padding: '2rem' }}>Cargando...</div>` inline. Funciona pero queda feo y disperso.
- **Qué hacer:** componente `<Loader />` reutilizable + `<ErrorState />`. Reemplazar los inline.

---

## 🟠 P1 — Importantes post-MVP

### `FE-010` UI de reseñas
- **Depende de:** BE-010.
- **Componentes:** `<EstrellasRating />` (display y selector), `<ReviewItem />`, `<FormReview />`.
- **Dónde:** página de detalle del profesional (todavía no existe — `FE-014`).

### `FE-011` Página de detalle del profesional `/profesionales/:id`
- **Por qué:** hoy el listado tira los datos pero no hay perfil dedicado. Sin esto no podemos hacer SEO de perfiles.
- **Qué incluir:** nombre, foto (si subió), rubro, especialidades, reseñas, mapa de zona, botón de WhatsApp.

### `FE-012` Login con Google
- **Depende de:** BE-012.
- **Lib:** `@react-oauth/google` o el hook nativo si Google JS Lib alcanza.
- **Donde:** botón en `Login.jsx` y `Registro.jsx`.

### `FE-013` Mostrar al usuario cuándo se actualizaron los precios
- **Por qué:** `chat.js` ya devuelve `_meta.preciosActualizados` pero el frontend no lo usa.
- **Qué hacer:** mini-banner debajo del chat: "Precios actualizados al DD/MM" con tooltip al `_meta.fuente`.

### `FE-014` Dashboard del profesional PRO
- **Depende de:** BE-011.
- **Qué muestra:** visitas a perfil últimos 7/30 días, click en teléfono, comparativa con otros PRO de la zona.

### `FE-015` Confirmación tras volver de MercadoPago
- **Dónde:** ya existe `back_url=...?estado=aprobado` en `suscripciones.js:46`.
- **Falta:** `Registro.jsx` debe leer ese query param, mostrar mensaje de éxito y refrescar el estado del usuario.

### `FE-016` Validaciones de formulario más finas
- **Por qué:** hoy si el usuario manda mal los campos, el error viene del backend en español de error 400.
- **Qué hacer:** validar email/telefono/matrícula en el cliente antes de submit. Sugerir react-hook-form si los forms se complican.

---

## 🟡 P2 — Mejoras

### `FE-020` Optimizar imágenes y assets
- Logo y banners → SVG/WebP.
- Lazy loading en `Electricistas.jsx`.

### `FE-021` Filtros en URL
- **Por qué:** que un cliente comparta el link `/profesionales?provincia=cordoba&categoria=plomero` y abra con esos filtros aplicados.
- **Cómo:** `useSearchParams` de React Router 6.

### `FE-022` Skeleton loading en listados
En vez del "Cargando..." plano, skeletons del shape final.

### `FE-023` Modal de detalle del profesional desde el listado
Para que clickear un pro no recargue la página entera.

### `FE-024` Tests con Vitest + Testing Library
Cobertura mínima: `useChat`, `AuthContext`, `BuscadorGeo`.

### `FE-025` Modo oscuro
Hay tokens en `global.css`. Sumar toggle. Persistir en localStorage.

---

## 🟢 P3 — Nice to have

- `FE-030` PWA con service worker e instalable
- `FE-031` Atajos de teclado en el chat
- `FE-032` Compartir presupuesto generado (link único o PDF)
- `FE-033` i18n (inglés) — solo si vamos a otros países
- `FE-034` Onboarding interactivo para profesionales nuevos

---

## 🔴 P0 — Bloqueantes del MVP (lead matching y verificación)

### `FE-040` CTA + modal "Contactar profesional" en `/presupuesto`
- **Dónde:** `pages/Presupuesto.jsx`, al final del último mensaje de la IA.
- **Comportamiento:**
  - CTA: "📞 Contactá a un profesional con este detalle"
  - Modal con 3 sugerencias destacadas (foto, nombre, plan, badge ✓ si aplica, rating, distancia)
  - Botón "Ver más" para expandir
  - Cliente selecciona checkbox de hasta 3
- **Datos:** `POST /api/solicitudes/sugerencias` con `categoriaSlug` y `ubicacion`.

### `FE-041` Form solicitud + OTP (multi-step)
- **Dónde:** modal/wizard que continúa después de FE-040.
- **Pasos:**
  1. Datos cliente (nombre, teléfono, email opcional, dirección aproximada)
  2. Mensaje extra al pro (opcional)
  3. Verificación OTP — input 6 dígitos
  4. Confirmación con resumen + botón "Enviar"
- **Estado:** loading mientras va al backend. Toast de éxito.
- **Después:** página `/solicitudes/:id/gracias` con next steps ("te llegará un mail cuando alguien acepte").

### `FE-042` Tab "Solicitudes" en `/panel` del pro
- **Dónde:** `pages/Panel.jsx` (sumar tab si no hay tabs todavía).
- **UI:**
  - Lista de solicitudes con estado (pendiente / aceptada / rechazada / expirada)
  - Card de cada solicitud: cliente (con badge ✓ si está verificado), categoría, fecha, preview del presupuesto
  - Acciones en pendiente: "Aceptar" / "Rechazar (motivo)"
  - Estado con color: amarillo pendiente, verde aceptada, gris rechazada/expirada
- **Badge en header del panel:** contador de solicitudes nuevas.

### `FE-043` Wizard de verificación de identidad
- **Dónde:** `/verificacion` (nueva ruta) — accesible desde panel del pro y del cliente.
- **3 pasos:**
  1. Subir foto DNI frente (drag & drop + preview)
  2. Subir foto DNI dorso
  3. Selfie con cartel "Profi DD/MM/AAAA" (mostrar fecha actual + texto a copiar)
- **Upload directo a R2/S3** con pre-signed URLs (no pasa por backend).
- **Estado final:** "En revisión" — explicar que toma 24–48hs.
- **Estados visibles en panel:** pendiente / aprobada ✓ / rechazada (con motivo).

---

## 🟠 P1 — Importantes post-MVP (lead/verificación)

### `FE-044` Página `/admin/verificaciones`
- **Dónde:** sumar a `pages/admin/`.
- **UI:**
  - Cola de pendientes con miniaturas de DNI frente + selfie
  - Click → vista detallada con las 3 imágenes a tamaño real (URLs pre-firmadas, expiran 5 min)
  - Botones "Aprobar" / "Rechazar (motivo)"
  - Filtros: pendientes / aprobadas hoy / rechazadas / todas
  - Badge en sidebar admin con contador de pendientes

### `FE-045` Badge ✓ azul en listados y perfiles
- **Dónde:**
  - Listado de profesionales (`pages/Electricistas.jsx`)
  - Detalle del profesional (`FE-011`)
  - Modal de sugerencias (`FE-040`)
  - Header del panel (al lado del nombre del usuario)
- **Componente:** `<BadgeVerificado />` reutilizable.
- **Tooltip:** "Identidad verificada por Profi".

### `FE-046` Estados de verificación en panel
- **Dónde:** `Panel.jsx`.
- **Casos:**
  - No verificada: banner grande "Verificate y duplicá tus leads" → CTA al wizard
  - Pendiente: card amarilla "En revisión — 24/48hs"
  - Aprobada: card verde "Verificada ✓ desde DD/MM/AAAA"
  - Rechazada: card roja "Rechazada — motivo: X" + botón "Reintentar"

---

## Hechas

(vacío)
