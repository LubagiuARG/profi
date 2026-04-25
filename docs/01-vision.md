# 01 · Visión

## El problema

Cuando alguien necesita contratar un oficio en Argentina (electricista, plomero, gasista, pintor, albañil…) hoy enfrenta tres dolores:

1. **No tiene idea cuánto debería costar.** Los precios sugeridos por gremios (CMO, CAS, etc.) están en PDFs/HTML que nadie lee y desactualizados.
2. **No sabe a quién llamar.** Termina recurriendo a un grupo de WhatsApp del barrio, Marketplace o "el primo de un amigo". Sin reseñas, sin matrícula verificada.
3. **El profesional matriculado no tiene canal digital propio.** Depende de boca en boca y plataformas genéricas (Zonajobs, MercadoLibre Servicios) que no entienden su oficio.

## La solución

**Profi** es una plataforma con dos productos integrados:

### 1. Asistente de presupuestos con IA
El cliente describe el trabajo en lenguaje natural ("quiero cambiar el tablero de mi casa"). La IA (Claude) consulta tablas de precios oficiales actualizadas automáticamente y devuelve un presupuesto orientativo con desglose de mano de obra, materiales estimados y notas (matrícula requerida, validez, etc.).

### 2. Directorio de profesionales verificados
Profesionales matriculados publican su perfil con zona de cobertura, especialidades, reseñas y rating. Pueden estar en plan **free** (visibilidad básica) o **PRO** (destaque en listados, sin publicidad, perfil completo, badge de verificado).

## Quién usa Profi

| Persona | Qué busca | Qué pasa hoy |
|---------|-----------|--------------|
| **Cliente particular** | Presupuesto rápido + alguien confiable que haga el trabajo | Pide precios en grupos de WhatsApp y reza |
| **Profesional matriculado** | Conseguir trabajos y diferenciarse del informal | Publica en MercadoLibre Servicios o vive del boca a boca |
| **Profesional informal** | Lo mismo, sin matrícula | Mismo canal, sin diferenciación |
| **Admin (nosotros)** | Verificar matrículas, gestionar categorías | (todavía no existe ese rol en otras plataformas) |

## Qué nos diferencia

- **Multi-rubro desde el día uno.** No es solo electricistas (a pesar del nombre original). Cada rubro tiene su tabla de referencia y prompt especializado.
- **Datos actualizados automáticamente.** Scrapeamos las tablas oficiales todos los días — el cliente nunca recibe un precio viejo.
- **Verificación de matrícula.** Es nuestro filtro de calidad. Quien no la tiene queda en otro tier.
- **Argentina-first.** Localización por provincia/localidad/radio en km usando datos georef oficiales.

## Modelo de negocio

| Fuente | Detalle |
|--------|---------|
| **Suscripciones PRO** | $20.000/mes (ARS) por profesional, recurrente vía MercadoPago PreApproval |
| **AdSense** | Banners en páginas públicas (`AdBanner.jsx` ya armado) |
| **Sponsors / pauta directa** | A futuro, cuando haya tráfico |

El presupuesto con IA es **gratuito para clientes** — es el imán que trae tráfico.

## Mercado objetivo

- **Geo:** Argentina (CABA + GBA primero, luego provincias por demanda)
- **Rubros priorizados** (orden tentativo MVP → escalar):
  1. Electricistas (ya empezado, tabla CMO de electroinstalador.com)
  2. Plomeros / gasistas matriculados
  3. Pintores
  4. Albañiles / yeseros
  5. Tecnicos de aire acondicionado, refrigeración
  6. Carpinteros, cerrajeros, vidrieros…

## Lo que **NO** somos

- No somos un marketplace transaccional (no procesamos el pago entre cliente y profesional).
- No somos un sistema de booking (no manejamos calendarios ni reservas).
- No competimos con Mercado Libre Servicios en escala — competimos en **calidad y especialización**.
