# ⚡ ElectroAR — Frontend

Plataforma de presupuestos eléctricos inteligentes y directorio de electricistas verificados en Argentina.

## Tecnologías

- **React 18** + **Vite 5**
- **React Router DOM v6** — navegación entre páginas
- **CSS Modules** — estilos con scope por componente
- **Claude API (Anthropic)** — asistente de presupuestos con IA
- **MercadoPago** — suscripciones de electricistas (a integrar)

---

## 🚀 Cómo arrancar

### 1. Instalá las dependencias

```bash
npm install
```

### 2. Configurá las variables de entorno

```bash
cp .env.example .env
```

Editá `.env` y completá:

```env
# Solo para desarrollo — en producción va en el backend
VITE_ANTHROPIC_KEY=sk-ant-api03-TU_CLAVE_AQUI

# Public key de MercadoPago (va en el frontend)
VITE_MP_PUBLIC_KEY=APP_USR-TU_CLAVE_AQUI
```

> **Importante:** Conseguí tu API key de Anthropic en https://console.anthropic.com  
> Conseguí tu Public Key de MercadoPago en https://www.mercadopago.com.ar/developers/panel

### 3. Corré el servidor de desarrollo

```bash
npm run dev
```

La app queda disponible en `http://localhost:5173`

---

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── Header.jsx         # Navegación sticky
│   ├── Header.module.css
│   ├── AdBanner.jsx       # Banner de publicidad (AdSense / sponsors)
│   ├── AdBanner.module.css
│   ├── Footer.jsx
│   └── Footer.module.css
│
├── pages/
│   ├── Presupuesto.jsx        # Asistente IA + chat de presupuestos
│   ├── Presupuesto.module.css
│   ├── Electricistas.jsx      # Directorio con filtros y búsqueda
│   ├── Electricistas.module.css
│   ├── Registro.jsx           # Registro de electricistas + planes + pago
│   └── Registro.module.css
│
├── services/
│   └── claude.js          # Integración con la API de Anthropic
│
├── hooks/
│   └── useChat.js         # Estado del chat (mensajes, loading, errores)
│
├── styles/
│   └── global.css         # Tokens de diseño, utilidades globales
│
├── App.jsx                # Rutas principales
└── main.jsx               # Entry point
```

---

## 🏗️ Arquitectura para producción

En producción **nunca** expongas la API key de Anthropic en el frontend.  
El flujo correcto es:

```
Usuario → Frontend React → Tu Backend Node.js → API Anthropic
                                             → API MercadoPago
```

El backend expone un endpoint `/api/chat` que recibe los mensajes y hace la llamada a Anthropic con la clave guardada en variables de entorno del servidor.

Cuando tengas el backend listo, completá `VITE_API_URL` en el `.env`:

```env
VITE_API_URL=https://api.tudominio.com
```

Y el frontend automáticamente usará el backend en lugar de llamar directo a Anthropic.

---

## 💰 Monetización

### Google AdSense
Reemplazá el componente `AdBanner.jsx` con el snippet de AdSense una vez aprobada la cuenta:

```jsx
// src/components/AdBanner.jsx
<ins className="adsbygoogle"
  style={{ display: 'block' }}
  data-ad-client="ca-pub-XXXXXXXXXX"
  data-ad-slot="XXXXXXXXXX"
  data-ad-format="auto" />
```

### MercadoPago — Suscripciones
En el backend, cuando el electricista seleccione Plan PRO:

```js
// backend/routes/pagos.js
const { MercadoPagoConfig, Preference } = require('mercadopago')
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })

// Crear preferencia de pago y retornar init_point al frontend
```

---

## 📦 Build para producción

```bash
npm run build
# Los archivos quedan en /dist — subí esa carpeta a tu hosting
```

Opciones de hosting recomendadas:
- **Vercel** (gratuito, ideal para React)
- **Netlify** (gratuito)
- **VPS propio** (Railway, Render, DigitalOcean)

---

## 🔐 Seguridad

- Nunca commitees el archivo `.env` (ya está en `.gitignore`)
- La API key de Anthropic va **solo** en el backend en producción
- La Public Key de MercadoPago sí puede ir en el frontend
- El Access Token de MercadoPago va **solo** en el backend

---

## 📋 Próximos pasos sugeridos

- [ ] Conectar con backend Node.js + Express
- [ ] Base de datos PostgreSQL para electricistas registrados
- [ ] Autenticación JWT para electricistas
- [ ] Panel de administración para aprobar perfiles
- [ ] Sistema de reseñas y calificaciones
- [ ] Integración real con MercadoPago Subscriptions
- [ ] Google AdSense
- [ ] PWA (Progressive Web App) para móvil

---

Hecho con ⚡ para Argentina
