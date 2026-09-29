# TASKFLOW Worker — contenedor independiente (doc §8, regla 6)
# Imagen propia y aislada: sin puertos expuestos ni tráfico HTTP.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S taskflow && adduser -S taskflow -G taskflow

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER taskflow

CMD ["node", "src/index.js"]
