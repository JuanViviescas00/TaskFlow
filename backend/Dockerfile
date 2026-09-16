# TASKFLOW Backend — API REST + Socket.IO (doc §6, §19)
# Imagen única: el servicio "worker" reutiliza esta imagen con otro comando.

# ---- Etapa 1: dependencias de producción ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Etapa 2: imagen final ----
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Usuario sin privilegios (buena práctica)
RUN addgroup -S taskflow && adduser -S taskflow -G taskflow

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER taskflow
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]
