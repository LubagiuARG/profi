# ⚡ ElectroAR — Backend

API REST + Scraper automático de precios CMO de ElectroInstalador.com

## Cómo funciona el scraper

1. Al arrancar el servidor por primera vez, scrapea automáticamente la página de precios
2. Guarda los precios en `cache/precios.json`
3. Todos los días a las **3am (hora Argentina)** vuelve a scrapear y actualiza el cache
4. Cada consulta al chat inyecta los precios actualizados en el prompt de Claude

## Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env
cp .env.example .env
# → Editar .env con tu ANTHROPIC_API_KEY

# 3. Correr en desarrollo
npm run dev

# 4. O hacer un scraping manual primero
npm run scrape
```

El servidor queda en `http://localhost:3001`

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/health` | Estado del servidor |
| `POST` | `/api/chat` | Consulta al asistente IA |
| `GET`  | `/api/precios/estado` | Estado del cache de precios |
| `GET`  | `/api/precios/datos` | Ver todos los precios cacheados |
| `POST` | `/api/precios/actualizar` | Disparar scraping manualmente |

### Ejemplo de consulta al chat

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Quiero cambiar el tablero de mi casa"}],
    "userType": "particular"
  }'
```

Respuesta:
```json
{
  "texto": "Para el cambio de tablero...",
  "items": [
    { "label": "Empotrado mampostería 1-24 bocas (CMO)", "val": "$185.300" },
    { "label": "Diferencial + termomagnética x2 circuitos", "val": "$163.800" }
  ],
  "total": "$349.100 – $420.000",
  "notas": "Requiere matricula habilitante. Materiales no incluidos.",
  "_meta": {
    "preciosActualizados": "2025-04-16T03:00:00.000Z",
    "fuente": "https://www.electroinstalador.com/..."
  }
}
```

### Disparar scraping manual (con token de admin)

```bash
curl -X POST http://localhost:3001/api/precios/actualizar \
  -H "x-admin-token: TU_ADMIN_TOKEN"
```

## Estructura

```
electro-ar-backend/
├── server.js              # Entrada principal + cron job
├── routes/
│   ├── chat.js            # POST /api/chat — IA + precios
│   └── precios.js         # GET/POST /api/precios/*
├── services/
│   └── scraper.js         # Lógica de scraping y parseo
├── middleware/
│   └── rateLimiter.js     # Rate limiting
├── cache/
│   └── precios.json       # Cache generado automáticamente
├── .env.example
└── package.json
```

## Seguridad implementada

- **Helmet**: headers HTTP de seguridad
- **CORS**: solo permite requests desde el frontend configurado
- **Rate limiting**: 100 req/15min general, 10 req/min para el chat
- **No expone la API key de Anthropic**: solo vive en el backend

## Despliegue en producción

### Railway (recomendado, gratis para empezar)
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set FRONTEND_URL=https://tu-frontend.vercel.app
```

### Render
1. Crear nuevo Web Service en render.com
2. Conectar tu repo de GitHub
3. Build command: `npm install`
4. Start command: `node server.js`
5. Agregar variables de entorno en el panel

### VPS propio (DigitalOcean, Contabo, etc.)
```bash
# Con PM2 para que corra siempre
npm install -g pm2
pm2 start server.js --name electro-ar-backend
pm2 save
pm2 startup
```

## Importante sobre el scraper

- Si ElectroInstalador cambia el HTML de su página, el parseo puede fallar
- En ese caso el servidor usa el cache anterior y loggea un warning
- El endpoint `POST /api/precios/actualizar` sirve para testear manualmente
- Revisá los logs regularmente para detectar cambios en la estructura del sitio
