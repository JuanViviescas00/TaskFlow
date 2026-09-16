# TASKFLOW — Backend

API REST + Socket.IO del sistema TASKFLOW (gestión y procesamiento de solicitudes), según `Doc/ARQUITECTURA_TASKFLOW.md`.

**Stack:** Node.js + Express · MongoDB (Mongoose) · Redis (ioredis) · Socket.IO

## Estructura

```
backend/src
├── app.js                  # Express: CORS, JSON, rutas, errores
├── server.js               # Bootstrap HTTP + Socket.IO
├── config/                 # env, mongo, redis
├── models/Solicitud.js     # Entidad SOLICITUD
├── routes/                 # /api/solicitudes, /api/estadisticas, /api/monitor
├── controllers/            # Coordinan peticiones
├── services/               # Lógica de negocio, caché, cola, estadísticas
├── middlewares/            # Manejo central de errores
├── sockets/                # Socket.IO + relevo de eventos del worker
├── utils/                  # Constantes y reglas de respuesta por categoría
├── worker/index.js         # Worker independiente (procesa la cola)
└── scripts/seed.js         # Datos de ejemplo (opcional)
```

## Requisitos

- Node.js ≥ 18
- MongoDB en `localhost:27017` (luego será el contenedor `mongoserver`)
- Redis en `localhost:6379` (luego será el contenedor `redisserver`)

La forma recomendada es **Docker Compose**, que levanta los 5 servicios
completos (ver sección siguiente).

## Docker Compose (doc §9-§11, §19, HU-13)

Desde la raíz del proyecto:

```bash
docker compose up -d --build       # levanta los 5 servicios
docker compose ps                  # verifica estado y healthchecks
docker compose logs -f worker      # sigue al worker en vivo

# Datos de ejemplo (opcional), dentro de la red de contenedores:
docker compose exec backend node src/scripts/seed.js

docker compose down                # detiene todo (los datos persisten)
docker compose down -v             # detiene y borra el volumen mongo-data
```

### Puertos desde el equipo anfitrión (HU-13)

| Servicio | Puerto anfitrión | Puerto interno (contenedor) |
|---|---|---|
| Frontend (Vue + Nginx) | **8080** | 80 |
| Backend (API + Socket.IO) | **3001** | 3000 |
| MongoDB (`mongoserver`) | **27018** | 27017 |
| Redis (`redisserver`) | **6380** | 6379 |
| Worker | — (sin puerto; proceso interno) | — |

> El puerto publicado al anfitrión es distinto del interno (doc §10).

### Comunicación entre contenedores (doc §10)

Por nombres de servicio, nunca `localhost`:

```text
backend → mongoserver:27017 · redisserver:6379
worker  → mongoserver:27017 · redisserver:6379 · backend:3000
frontend→ http://localhost:3001 (desde el navegador del anfitrión)
```

### Persistencia (doc §11)

MongoDB usa el volumen Docker **`mongo-data`** montado en `/data/db`:
los datos sobreviven a `docker compose down` y a la recreación de contenedores.

## Configuración

```bash
cd backend
cp .env.example .env   # ajusta si tus puertos difieren
npm install
```

## Ejecución

```bash
# Terminal 1 — API (puerto 3000)
npm run dev

# Terminal 2 — Worker independiente
npm run worker

# (Opcional) datos de ejemplo
npm run seed
```

> En Docker Compose esa configuración la inyecta `docker-compose.yml`; el `.env`
> solo aplica a la ejecución local (Node en el anfitrión).

### Estructura Docker del proyecto (3 Dockerfiles + 1 compose)

| Archivo | Contenido |
|---|---|
| `backend/Dockerfile` | Imagen del **backend**: API REST + Socket.IO |
| `backend/Dockerfile.worker` | Imagen del **worker** independiente (doc regla 6): sin puertos ni healthcheck HTTP |
| `frontend/Dockerfile` | Imagen del **frontend**: build Vite + Nginx |
| `docker-compose.yml` (raíz) | Define los **5 servicios** (doc §9): `frontend`, `backend`, `worker`, `mongoserver`, `redisserver` |

MongoDB y Redis no tienen Dockerfile propio: usan las imágenes oficiales
`mongo:7` y `redis:7-alpine` directamente en el compose.

## API REST

| Método | Endpoint | Función |
|---|---|---|
| GET | `/api/solicitudes` | Listar (filtros: `estado`, `categoria`, `prioridad`, `q`, `limite`, `pagina`) |
| GET | `/api/solicitudes/:id` | Detalle de una solicitud |
| POST | `/api/solicitudes` | Registrar solicitud (valida, guarda, encola) |
| PUT | `/api/solicitudes/:id` | Actualizar (solo en `PENDIENTE` o `ERROR`) |
| DELETE | `/api/solicitudes/:id` | Eliminar solicitud |
| GET | `/api/estadisticas` | Contadores para el Dashboard (caché) |
| GET | `/api/monitor` | Estado de servicios, cola y contadores |
| GET | `/health` | Liveness del backend |

Todas las respuestas de listado/detalle/estadísticas incluyen el header
**`X-Cache: HIT | MISS`** para demostrar el uso de Redis (HU-08).

## Estados

`PENDIENTE → EN_COLA → PROCESANDO → RESPONDIDA` (error: `→ ERROR`)

## Eventos Socket.IO (doc §21.3)

`solicitud-creada`, `solicitud-encolada`, `solicitud-procesando`,
`solicitud-respondida`, `solicitud-error`, `cola-actualizada`,
`monitor-actualizado`

El Worker se conecta al backend como cliente de Socket.IO y el backend
retransmite sus eventos a los navegadores.

## Prueba de flujo completo (HU-01 … HU-08)

```bash
# 1. Crear una solicitud
curl -s -X POST http://localhost:3000/api/solicitudes \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Certificado","descripcion":"Necesito un certificado","categoria":"Documento","prioridad":"Alta"}'

# 2. Detalle (MISS la 1ª vez, HIT la 2ª)
curl -si http://localhost:3000/api/solicitudes/<ID> | findstr /i "X-Cache estado"

# 3. Ver el estado evolucionar en el listado
curl -s http://localhost:3000/api/solicitudes | findstr /i "estado"

# 4. Monitor
curl -s http://localhost:3000/api/monitor
```

Demo de cola (HU-04): detén el Worker, crea varias solicitudes y observa que
quedan `EN_COLA`; vuelve a iniciar el Worker y se procesan solas.
