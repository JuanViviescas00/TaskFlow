# TROUBLESHOOTING.md — Registro de Bugs, Problemas y Soluciones

Este documento mantiene la trazabilidad técnica de todos los problemas diagnosticados, decisiones de arquitectura y soluciones aplicadas en **TASKFLOW** (Regla 1).

---

## 1. Separación del Microservicio Worker a Carpeta Raíz (`/worker`)
- **Fecha y Hora:** 2026-09-28 21:22:00 -05:00
- **Descripción del Problema / Bug:** El Worker se encontraba acoplado dentro de la carpeta `backend/src/worker/` compartiendo el mismo `package.json` del servidor API, y en el Monitor aparecía como `✗ No disponible` al ejecutar solo `npm run dev` en el backend.
- **Causa Raíz:** El requisito arquitectónico del proyecto exige que el Worker opere como un servicio independiente desde la raíz del proyecto, con su propio entorno de ejecución, `Dockerfile` y ciclo de vida separado del API REST.
- **Solución Aplicada:**
  1. Se creó el directorio independiente `/worker` en la raíz con su propio `package.json`, `Dockerfile` y configuración de conexión a MongoDB Atlas y Redis (`BRPOP`).
  2. Se actualizó `docker-compose.yml` para construir el servicio `worker` desde `./worker`.
  3. Se limpiaron de `backend/package.json` los scripts del worker y la dependencia `socket.io-client`.
- **Archivos Modificados:**
  - `worker/package.json`, `worker/Dockerfile`, `worker/src/index.js`, `worker/src/config/*`, `worker/src/models/Solicitud.js`, `worker/src/services/*`, `worker/src/utils/*`
  - `docker-compose.yml`
  - `backend/package.json`
- **Verificación:** Ejecución de `node -e "require('./src/config/env')"` y arranque del proceso Worker reportando conexión exitosa a MongoDB Atlas, Redis y emisión de `worker:heartbeat` cada 5s hacia el backend.

---

## 2. Migración de MongoDB Contenedor Local a MongoDB Atlas
- **Fecha y Hora:** 2026-09-28 19:55:00 -05:00
- **Descripción del Problema / Bug:** Necesidad de reemplazar el contenedor local `mongoserver` por una base de datos cloud en MongoDB Atlas sin exponer credenciales en el repositorio Git.
- **Causa Raíz:** `docker-compose.yml` y los archivos `.env` apuntaban a `mongodb://mongoserver:27017/taskflow` y dependían del healthcheck de un contenedor local.
- **Solución Aplicada:**
  1. Se eliminó el servicio `mongoserver` y el volumen `mongo-data` de `docker-compose.yml`.
  2. Se parametrizó `MONGODB_URI: ${MONGODB_URI}` en `docker-compose.yml` y se crearon plantillas seguras `.env.example`.
  3. Se añadieron timeouts de selección de servidor (`serverSelectionTimeoutMS: 10000`) en `mongo.js` tanto en `backend` como en `worker`.
- **Archivos Modificados:**
  - `docker-compose.yml`
  - `.env.example`, `backend/.env.example`, `worker/.env.example`
  - `backend/src/config/mongo.js`, `worker/src/config/mongo.js`
- **Verificación:** Arranque del backend y worker mostrando `[mongo] Conectado a MongoDB Atlas` y verificación con `git check-ignore -v` garantizando que ningún archivo `.env` real sea versionado.

---

## 3. Error `EADDRINUSE: address already in use 0.0.0.0:3001` y Puerto Redis
- **Fecha y Hora:** 2026-09-28 20:14:00 -05:00
- **Descripción del Problema / Bug:** Al iniciar `npm run dev` en `backend`, el servidor crasheaba con `Error: listen EADDRINUSE: address already in use 0.0.0.0:3001`, y previamente lanzaba errores de reconexión a Redis (`[redis:cola] Error`).
- **Causa Raíz:**
  1. Docker Desktop estaba apagado, por lo que el contenedor `redis-local` en el puerto `6379` no estaba activo.
  2. Un proceso previo de Node.js (`PID 10588`) había quedado huérfano escuchando en el puerto `3001`.
- **Solución Aplicada:**
  1. Se inició Docker Desktop y se levantó el contenedor `redis:7-alpine` en el puerto `6379`.
  2. Se identificó el proceso huérfano con `netstat -ano | findstr :3001` y se finalizó con `taskkill /PID 10588 /F`.
- **Archivos Modificados:** Ninguno (ajuste operativo de entorno local).
- **Verificación:** Comprobación de puerto libre y arranque limpio de Express y Socket.IO en `http://0.0.0.0:3001`.

---

## 4. Limpieza de Código Muerto tras Fusión en `main` y Adecuación a `DESIGN.md`
- **Fecha y Hora:** 2026-10-12 17:30:00 -05:00
- **Descripción del Problema / Bug:** Tras el merge de ramas en `main`, quedaron 14 archivos de componentes/stores huérfanos en `frontend/src/` que no eran importados por ninguna vista activa, además de la dependencia `pinia` sin uso y `cursor: default` en las tarjetas `.statcard`.
- **Causa Raíz:** Archivos remanentes de un PR previo que fueron reemplazados por la arquitectura simplificada de vistas directas y diseño plano XY.
- **Solución Aplicada:**
  1. Se eliminaron los 14 archivos huérfanos (`layouts/`, `components/common/`, `components/layout/`, `components/monitor/`, `components/requests/`, `store/`, `useRequests.js`, `useToast.js`) aplicando la regla *Ponytail (YAGNI / Deletion beats addition)*.
  2. Se removió `pinia` de `frontend/src/main.js` y `frontend/package.json`.
  3. Se actualizó `.statcard` con `cursor: pointer` en `frontend/src/styles/main.css` y se documentó la arquitectura visual en `DESIGN.md`.
- **Archivos Modificados:**
  - `frontend/src/main.js`, `frontend/package.json`, `frontend/src/styles/main.css`
  - `backend/package.json`
  - `DESIGN.md`, `TROUBLESHOOTING.md`
  - Eliminados 14 archivos sin uso en `frontend/src/`
- **Verificación:** Compilación de producción con `npm run build` en `frontend/` exitosa y sin advertencias.

---

## 5. Preparación para Despliegue en Render (Contenedor All-in-One con Redis Interno)
- **Fecha y Hora:** 2026-11-04 19:28:00 -05:00
- **Descripción del Problema / Bug:** En el plan gratuito de Render, los Background Workers son de pago ($7/mes) y el servicio de Redis administrado expira a los 30 días; además, requerir servicios externos como Upstash añade complejidad de registro de cuentas.
- **Causa Raíz:** Necesidad de desplegar el sistema completo (Frontend Vue + Backend Express + Worker + Redis Server) en un único Web Service gratuito de Render que sea 100% autosuficiente y permanente.
- **Solución Aplicada:**
  1. Se instaló `redis` en Alpine dentro del `Dockerfile` multi-stage y se creó `docker-entrypoint.sh` para iniciar `redis-server --daemonize yes` en `127.0.0.1:6379` antes de arrancar los procesos de Node.js.
  2. Se configuró `ecosystem.config.cjs` para ejecutar `backend/src/server.js` y `worker/src/index.js` en paralelo con PM2 en el mismo contenedor.
  3. Se configuró Express en `backend/src/app.js` para servir los estáticos compilados de `frontend/dist` en producción y soportar HTML5 History Mode de Vue Router.
  4. Backend y Worker se conectan a `redis://localhost:6379` localmente sin necesidad de configurar ninguna variable `REDIS_URL` en Render.
  5. Se mantuvieron intactos `docker-compose.yml` y los entornos locales para las pruebas y sustentación del SENA.
- **Archivos Modificados:**
  - `Dockerfile`, `docker-entrypoint.sh`, `ecosystem.config.cjs`, `.dockerignore`, `render.yaml`
  - `backend/src/app.js`, `backend/src/config/redis.js`, `worker/src/config/redis.js`
  - `frontend/src/plugins/axios.js`, `frontend/src/plugins/socket.js`
  - `TROUBLESHOOTING.md`
- **Verificación:** Normalización de saltos de línea LF en entrypoint, compilación de frontend verificada y prueba de módulos de backend con Node.js.
