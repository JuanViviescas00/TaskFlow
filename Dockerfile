# ==============================================================================
# TASKFLOW - Dockerfile de Producción para Render (Contenedor Unificado)
# Incluye Frontend (Vue), Backend (Express), Worker y Redis interno con PM2
# ==============================================================================

# ---- Etapa 1: Compilar Frontend (Vue 3 + Vite) ----
FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Etapa 2: Instalar Dependencias de Producción ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY worker/package*.json ./worker/
RUN cd worker && npm ci --omit=dev

# ---- Etapa 3: Imagen de Ejecución (Runtime) con Redis + PM2 ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Instalar Redis server ligero y PM2
RUN apk add --no-cache redis && npm install -g pm2

# Usuario sin privilegios por seguridad
RUN addgroup -S taskflow && adduser -S taskflow -G taskflow

# Copiar dependencias de producción
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/worker/node_modules ./worker/node_modules

# Copiar código fuente y configuración de procesos
COPY backend ./backend
COPY worker ./worker
COPY ecosystem.config.cjs ./
COPY docker-entrypoint.sh ./

# Copiar distribución del frontend compilado para que Express lo sirva estáticamente
COPY --from=build-frontend /app/frontend/dist ./frontend/dist

# Asegurar permisos correctos (incluyendo ejecución del entrypoint)
RUN chmod +x /app/docker-entrypoint.sh && chown -R taskflow:taskflow /app

USER taskflow

EXPOSE 3000

# El script inicia Redis interno y luego ejecuta PM2 con Backend y Worker
CMD ["/app/docker-entrypoint.sh"]
