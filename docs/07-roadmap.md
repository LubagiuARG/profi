# 07 · Roadmap

Vista alta de las fases. Tareas concretas → [`backlog/`](./backlog/).

## Fase 0 — Setup de orden (esta sesión)
**Objetivo:** que dos personas (vos + tu amigo) puedan trabajar en paralelo sin pisarse.

- [x] Estructura `profi-docs/` creada
- [x] `CLAUDE.md` en cada repo
- [x] `.claude/settings.local.json` en cada repo
- [ ] Pasar revisión los docs entre los dos
- [ ] Acordar quién toma qué del backlog

---

## Fase 1 — MVP lanzable
**Objetivo:** un cliente puede pedir presupuesto, conectarse con un pro y contratar; un pro puede registrarse, pagar PRO y recibir leads.

**Bloqueantes (sin esto no se lanza):**
1. Rebranding cosmético completo (UI dice "Profi", no "ElectroAR")
2. Webhook MercadoPago verificando firma
3. Email transaccional mínimo (welcome + confirmación de pago + nueva solicitud)
4. Multi-rubro real en presupuestos (al menos electricista + plomero/gasista)
5. **Lead matching:** cliente puede crear solicitud con OTP, pro recibe en panel y acepta/rechaza
6. **Verificación de identidad manual:** wizard de upload + cola admin + badge ✓
7. Términos + privacidad (incluyendo tratamiento de DNI/biometría — Ley 25.326)
8. Dominio propio + HTTPS
9. Error tracking básico (Sentry o similar)
10. Storage R2/S3 configurado para fotos de verificación

**Métrica de éxito:** 10 profesionales pagando PRO + 30 solicitudes generadas con al menos 50% aceptadas.

---

## Fase 2 — Confianza, reseñas y crecimiento del lead
**Objetivo:** que el cliente pueda decidir entre dos profesionales similares y que el pro vea valor en cada lead.

- Sistema de reseñas (cliente deja review tras cerrar solicitud)
- Verificación de matrícula con flujo claro (subir foto → admin aprueba) — segundo badge ⚡
- Tracking de visitas a perfil (incrementar `Profesional.visitas` en endpoint dedicado)
- Dashboard del profesional PRO (visitas, leads recibidos, % aceptados, click en teléfono)
- Login con Google (reduce fricción)
- Notificaciones por email cuando alguien ve tu perfil (PRO)
- Limitar leads por plan (FREE 3/mes, PRO ilimitado)
- Migrar verificación a proveedor KYC (Didit/Veriff) cuando duela el tiempo de admin (>20/día)

**Métrica de éxito:** profesional PRO ve valor concreto en su panel y renueva la suscripción. NPS post-trabajo > 7.

---

## Fase 3 — Crecimiento
**Objetivo:** crecer fuera de CABA/GBA y en rubros nuevos.

- AdSense activo y aprobado
- SEO técnico: sitemap, structured data, OG tags por rubro
- Páginas SEO por (rubro × localidad): "/electricista-en-rosario", "/plomero-en-cordoba"
- Programa de referidos (un profesional invita a otro y gana mes gratis)
- Soporte para más rubros (lista en `01-vision.md`)
- Categorías y filtros más finos (urgencias 24hs, atiende fines de semana, etc.)

---

## Fase 4 — Product-led
**Objetivo:** que la plataforma genere valor sola sin que tengamos que empujar.

- Mensajería interna cliente↔profesional (anónima primero, hasta que el pro acepta)
- Booking / calendario de turnos
- Pagos transaccionales (escrow): cliente paga al pro vía Profi, retenemos comisión
- App PWA con notificaciones push
- Versión multi-país (Uruguay/Chile como pilotos)

---

## Lo que NO está en el roadmap (a propósito)

- **App nativa iOS/Android.** PWA primero — la app nativa solo si la PWA no alcanza.
- **Reescritura tecnológica.** El stack actual escala muy lejos. No tocar a menos que sea bloqueante.
- **Modelo freemium para clientes.** Los presupuestos con IA son gratis para siempre. El dinero viene de los profesionales.
- **Integración con sistemas contables.** No somos eso.
