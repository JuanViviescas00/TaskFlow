# ==============================================================================
# TASKFLOW - Dockerfile de Producción para Render (Contenedor Unificado)
# Corre Backend (Express + Vue dist) y Worker en paralelo con PM2 en un solo Web Service
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

# ---- Etapa 3: Imagen de Ejecución (Runtime) con PM2 ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Instalar PM2 para gestionar ambos procesos en paralelo en un solo contenedor
RUN npm install -g pm2

# Usuario sin privilegios por seguridad
RUN addgroup -S taskflow && adduser -S taskflow -G taskflow

# Copiar dependencias de producción
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/worker/node_modules ./worker/node_modules

# Copiar código fuente y configuración de procesos
COPY backend ./backend
COPY worker ./worker
COPY ecosystem.config.cjs ./

# Copiar distribución del frontend compilado para que Express lo sirva estáticamente
COPY --from=build-frontend /app/frontend/dist ./frontend/dist

# Asegurar permisos correctos
RUN chown -R taskflow:taskflow /app

USER taskflow

EXPOSE 3000

# pm2-runtime ejecuta en primer plano enviando todos los logs a Render
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
