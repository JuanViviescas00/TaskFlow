# TASKFLOW Worker — proceso independiente (doc §8, regla 6)
# Imagen propia y aislada del backend (procesamiento asíncrono puro)

# ---- Etapa 1: dependencias de producción ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# ---- Etapa 2: imagen final ----
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Usuario sin privilegios por seguridad
RUN addgroup -S taskflow && adduser -S taskflow -G taskflow

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER taskflow

# El worker no sirve tráfico HTTP, consume la cola Redis en segundo plano
CMD ["node", "src/index.js"]
