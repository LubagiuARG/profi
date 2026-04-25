# 06 · Rebranding ElectroAR → Profi

El proyecto nació como **ElectroAR** (solo electricistas). Pivotamos a **Profi** (todos los oficios) pero el código viejo quedó.

Esta es la checklist completa para que no quede ningún rastro visible al usuario final.

## Por qué importa

- **Comercialmente:** "ElectroAR" excluye a un plomero o pintor que vea el sitio. La marca tiene que sentir hogar para todos los rubros.
- **Producto:** prompts y copys que dicen "asistente eléctrico" generan resultados raros si un cliente pregunta por una pérdida de gas.
- **SEO:** queremos rankear para "presupuesto plomero", "electricista cerca", "gasista matriculado", etc. — no para "electroAR".

## Lo que hay que cambiar

### Frontend
- [ ] `package.json` → `"name": "electro-ar"` → `"profi"`
- [ ] `index.html` → `<title>` y meta tags
- [ ] `src/components/Header.jsx` → logo / texto
- [ ] `src/components/Footer.jsx` → texto y créditos
- [ ] `src/pages/Home.jsx` → hero copy ("ElectroAR" → "Profi")
- [ ] `src/pages/Presupuesto.jsx` → títulos y placeholders
- [ ] `src/pages/Registro.jsx` → "Sumate a ElectroAR" → "Sumate a Profi"
- [ ] `src/pages/Electricistas.jsx` → renombrar página a `Profesionales` (el archivo y la ruta)
- [ ] `src/services/api.js`, `claude.js` → revisar si hay strings hardcoded
- [ ] `README.md` → reescribir
- [ ] `vercel.json` → revisar si hay nombre de proyecto
- [ ] **Renombrar repo** `electro-ar-frontend` → `profi-frontend` (en GitHub y local)

### Backend
- [ ] `package.json` → `"name": "electro-ar-backend"` → `"profi-backend"` y `"description"`
- [ ] `server.js` → logs de arranque (`⚡ ElectroAR Backend...`)
- [ ] `server.js:42-48` → lista `originesPermitidos` (hoy hardcodea `electro-ar-frontend.vercel.app`)
- [ ] `routes/chat.js:54` → system prompt empieza con "Sos el asistente de ElectroAR"
- [ ] `routes/suscripciones.js:17` → `PLAN_NOMBRE = 'ElectroAR — Plan PRO'`
- [ ] `middleware/auth.js` → `JWT_SECRET` default `'electro-ar-secret-key'` (debería ser obligatorio en env)
- [ ] `README.md` → reescribir
- [ ] `.env.example` → comentarios y URLs
- [ ] **Renombrar modelo Prisma** `Electricista` → `Profesional` (migración + actualizar todos los `prisma.electricista.*` → `prisma.profesional.*`)
- [ ] **Renombrar repo** `electro-ar-backend` → `profi-backend`

### Rutas API (decisión: ¿cuándo migramos?)

Hoy: `/api/electricistas`. Idealmente: `/api/profesionales`.

Opciones:
1. **Cambiar de una** y romper todo en una sola PR. Riesgo: se nos escapa algo en el frontend.
2. **Mantener ambas rutas** (alias) durante un release. Más seguro, más código que limpiar después.
3. **Postergar.** Funciona como está. El path es interno (no SEO).

> Recomendación: **opción 2** — agregar `/api/profesionales` como alias del actual y migrar el frontend. Después de un release sin issues, borrar `/api/electricistas`.

### Infraestructura
- [ ] Dominio: comprar `profi.com.ar` (o el que decidamos)
- [ ] Vercel: agregar el dominio nuevo, configurar DNS
- [ ] Railway: si querés un subdominio `api.profi.com.ar`
- [ ] Email transaccional: configurar `noreply@profi.com.ar`
- [ ] Variables `FRONTEND_URL` actualizadas en Railway
- [ ] Variable `back_url` de MercadoPago actualizada

### Producto / contenido
- [ ] Logo nuevo (Profi)
- [ ] Favicon
- [ ] OG image (lo que se ve cuando comparten el link en WhatsApp)
- [ ] Términos y privacidad con la nueva razón social / nombre fantasía
- [ ] Copy del onboarding del profesional (no más "ElectroInstalador" ni "electricistas matriculados")

### Prompts de IA
El system prompt de `routes/chat.js` está pensado solo para electricistas. Hay que:
- [ ] Detectar el rubro a partir de la consulta del cliente (o que el frontend lo envíe)
- [ ] Cargar la tabla de precios correspondiente
- [ ] Cambiar las instrucciones según rubro

Esto en realidad es **una tarea de producto, no solo de rebranding** — ver `backlog/tareas-backend.md`.

## Estrategia recomendada

Para no romper en producción:

1. **Fase 1 — Cambios cosméticos** (UI, copys, logos). No tocan datos ni rutas. Bajo riesgo.
2. **Fase 2 — Schema y rutas** con aliases. Releases incrementales.
3. **Fase 3 — Renombrar repos y dominios.** Cuando todo lo demás esté estable.

No mezclar las tres fases en una sola PR. Cada una se puede revertir independiente.
