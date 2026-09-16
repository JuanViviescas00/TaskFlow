# TASKFLOW — Sistema de Gestión y Procesamiento Asíncrono de Solicitudes

Proyecto Full Stack desarrollado para el programa **Tecnólogo en Análisis y Desarrollo de Software (ADSO) - SENA** (Ficha: 228118 / Taller Docker Compose).

---

## 👥 Integrantes del Equipo
- **Aprendiz 1:** [Nombre y Apellidos]
- **Aprendiz 2:** [Nombre y Apellidos]

---

## 📌 Descripción General
**TASKFLOW** es una solución web empresarial diseñada para resolver la saturación y pérdida de trazabilidad en la atención de solicitudes de usuarios. La plataforma desacopla la radicación web del procesamiento en segundo plano mediante colas y workers, automatiza las respuestas por reglas de negocio predefinidas y proporciona visibilidad y métricas en tiempo real.

---

## 🏗️ Arquitectura Distribuida (Microservicios)

```text
                      ┌─────────────────────────┐
                      │    FRONTEND (Vue 3)     │ Puerto 8080
                      └────────────┬────────────┘
                                   │ HTTP REST / WebSocket
                                   ▼
                      ┌─────────────────────────┐
                      │ BACKEND (Express API)   │ Puerto 3001
                      └───────┬─────────┬───────┘
                              │         │
                 ┌────────────┘         └────────────┐
                 ▼                                   ▼
      ┌──────────────────┐                 ┌──────────────────┐
      │  MongoDB Server  │                 │   Redis Server   │
      │   Persistencia   │                 │   Caché y Cola   │
      │   Puerto 27018   │                 │   Puerto 6380    │
      └──────────────────┘                 └────────┬─────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │ WORKER Node.js   │
                                          │   (Procesador    │
                                          │   Asíncrono)     │
                                          └──────────────────┘
```

---

## 📁 Estructura del Proyecto en la Raíz

```text
PROYECTO/
├── frontend/           # Aplicación cliente SPA en Vue 3 + Vite + Nginx
├── backend/            # API REST + Socket.IO en Node.js + Express
├── worker/             # Procesador en segundo plano de la cola Redis (Node.js)
├── Doc/                # Documentación del taller y arquitectura
├── docker-compose.yml  # Orquestador de los 5 contenedores
└── README.md           # Ficha técnica y guía de ejecución
```

---

## 🚀 Puesta en Marcha con Docker Compose

El proyecto se ejecuta en un solo comando gracias a Docker Compose:

### 1. Clonar el repositorio y levantar los servicios
```bash
# Construir imágenes y levantar los 5 contenedores en segundo plano
docker compose up -d --build

# Verificar estado de los contenedores
docker compose ps
```

### 2. Acceso a las aplicaciones desde el navegador
- **Frontend (Interfaz de Usuario):** [http://localhost:8080](http://localhost:8080)
- **Backend (API REST & Healthcheck):** [http://localhost:3001/health](http://localhost:3001/health)
- **Documentación / API Solicitudes:** [http://localhost:3001/api/solicitudes](http://localhost:3001/api/solicitudes)
- **Monitor de Servicios en vivo:** [http://localhost:8080/monitor](http://localhost:8080/monitor)

### 3. Puertos publicados hacia el equipo anfitrión

| Servicio | Contenedor | Puerto Anfitrión | Puerto Interno | Función |
|---|---|:---:|:---:|---|
| **frontend** | `taskflow-frontend` | **8080** | 80 | Interfaz web SPA (Nginx) |
| **backend** | `taskflow-backend` | **3001** | 3000 | API REST + Servidor Socket.IO |
| **worker** | `taskflow-worker` | — | — | Consumidor asíncrono de Redis Queue |
| **mongoserver** | `taskflow-mongoserver` | **27018** | 27017 | Base de datos (Volumen `mongo-data`) |
| **redisserver** | `taskflow-redisserver` | **6380** | 6379 | Servidor de Caché y Cola FIFO |

---

## 🧪 Guía para Demostración y Pruebas Obligatorias (Taller §17)

1. **Registro:** Ingresar a [http://localhost:8080/solicitudes/nueva](http://localhost:8080/solicitudes/nueva), registrar una solicitud y comprobar que aparece en el listado y se guarda en MongoDB.
2. **Respuesta Automática:** Abrir la solicitud y verificar que el estado pasa de `EN COLA` → `PROCESANDO` → `RESPONDIDA` con la respuesta predefinida según la categoría.
3. **Prueba de Cola:**
   ```bash
   # Detener el Worker
   docker compose stop worker
   ```
   Registrar 3 solicitudes desde Vue. Observar que permanecen seguras en estado **`EN COLA`** tanto en el listado como en el monitor.
4. **Recuperación:**
   ```bash
   # Iniciar nuevamente el Worker
   docker compose start worker
   ```
   Comprobar en tiempo real que el Worker retoma la cola y procesa todas las solicitudes acumuladas.
5. **Caché Redis:** Consultar una solicitud por primera vez (`CACHE MISS`), refrescar la consulta y evidenciar en la parte inferior de la pantalla o en cabeceras `X-Cache: HIT`.
6. **Persistencia de Datos:**
   ```bash
   # Reiniciar los contenedores
   docker compose restart
   ```
   Comprobar que todas las solicitudes y respuestas continúan intactas gracias al volumen `mongo-data`.
7. **Error Controlado:** Registrar una solicitud con la palabra `[ERROR]` en el título (ej: `Fallo de prueba [ERROR]`). El Worker capturará el error de forma controlada, pasará la solicitud a estado `ERROR` en color rojo y registrará el mensaje de error sin detener el sistema.
8. **Diseño Responsive:** Abrir las herramientas de desarrollo del navegador (`F12`) y validar que el menú y formularios se adaptan correctamente a tamaños móvil y tablet.

---

## 🛑 Detener el Proyecto
```bash
# Detener contenedores manteniendo los datos persistentes
docker compose down

# (Opcional) Detener y eliminar volúmenes si se desea reiniciar desde cero
docker compose down -v
```
