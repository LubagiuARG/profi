# 02 · Scope del MVP

El producto ya tiene **mucho construido**. Este doc separa qué consideramos parte del MVP "lanzable" vs. qué queda para fases siguientes.

## Estado actual (snapshot abril 2026)

✅ = listo · 🟡 = parcial · ❌ = no empezado

### Frontend
- ✅ Home pública
- ✅ Página de presupuestos con chat IA (modo cliente / profesional)
- ✅ Directorio de profesionales con filtros (zona, plan, búsqueda libre)
- ✅ Componente de geolocalización (provincia/localidad/radio)
- ✅ Registro de profesional con selección de plan
- ✅ Login + Panel del profesional autenticado
- ✅ Panel admin completo (dashboard, categorías, profesionales, admins)
- 🟡 README/copys siguen diciendo "ElectroAR"
- ❌ Sistema de reseñas público
- ❌ Login con Google
- ❌ PWA / mobile install

### Backend
- ✅ API REST con todas las rutas necesarias
- ✅ Prisma + PostgreSQL en Railway
- ✅ Auth JWT (profesionales y admins, con `superadmin`)
- ✅ Scraper diario de precios CMO (electricistas)
- ✅ Cache de precios en `cache/precios.json`
- ✅ MercadoPago PreApproval + webhook → activa Plan PRO
- ✅ Helmet + CORS + rate limit
- 🟡 Webhook MP **sin verificar firma** (riesgo en prod)
- 🟡 Scraper solo para rubro electricista — el resto no tiene fuente de precios
- ❌ Endpoints de reseñas
- ❌ Tracking de visitas a perfiles
- ❌ Tests automatizados

### Infraestructura
- ✅ Backend deployado en Railway
- ✅ Frontend deployado en Vercel
- ✅ Postgres administrado (Railway)
- ❌ Dominio propio en producción (`profi.com.ar` o similar)
- ❌ Email transaccional (welcome, recuperar password, notificación de pago)
- ❌ Monitoring / error tracking (Sentry o similar)

## Qué entra al MVP "lanzable"

El criterio: **un profesional puede registrarse, pagar PRO, y recibir consultas; un cliente puede pedir un presupuesto y encontrar un profesional cerca.**

### Imprescindibles (MVP v1)
1. **Rebranding ElectroAR → Profi** consistente en toda la UI y copy
2. **Multi-rubro real** — el chat de presupuestos tiene que poder responder al menos para 2 rubros (electricista + plomero/gasista)
3. **Webhook MP verificado** — sin esto no podemos cobrar en prod con seguridad
4. **Email transaccional** mínimo: welcome al registrarse + confirmación de pago
5. **Dominio propio + HTTPS** (Vercel + Railway lo facilitan)
6. **Política de privacidad + términos** (requisito legal y de AdSense)
7. **Página de "cómo funciona"** para clientes (educativa, también ayuda SEO)

### Importantes pero post-MVP
- Sistema de reseñas (cliente puede calificar al profesional después de contactarlo)
- Tracking de visitas + dashboard básico de analytics para el profesional PRO
- Login con Google (reduce fricción de registro)
- Notificaciones por email cuando un cliente "ve" tu perfil
- AdSense activo (requiere aprobación previa)
- SEO técnico: sitemap, structured data, OG tags

### Fuera del MVP (fase 2+)
- App nativa / PWA con notificaciones push
- Sistema de mensajería interna cliente↔profesional
- Booking / calendario de turnos
- Pagos transaccionales entre cliente y profesional (escrow)
- Programa de referidos
- Versión multi-país

## Definition of done para el MVP

Antes de hacer push público:
- [ ] Un profesional desde cero puede registrarse, pagar PRO, ver su perfil destacado
- [ ] Un cliente puede pedir presupuesto en al menos 2 rubros y obtener respuesta razonable
- [ ] Un cliente puede filtrar profesionales por provincia + localidad + radio
- [ ] Webhook de MP procesa correctamente: pago aprobado / cancelado / pausa
- [ ] Toda la UI dice "Profi" (no quedan rastros de ElectroAR salvo en repos/históricos)
- [ ] Hay términos y privacidad publicados
- [ ] Errores de prod llegan a algún lado (Sentry / log estructurado)
