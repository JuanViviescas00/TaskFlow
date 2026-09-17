'use strict';

// override: el .env del proyecto tiene prioridad sobre variables heredadas del sistema
require('dotenv').config({ override: true });

function enteroPositivo(valor, defecto) {
  const n = parseInt(valor, 10);
  return Number.isFinite(n) && n > 0 ? n : defecto;
}

const config = {
  port: enteroPositivo(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',
  // CORS_ORIGIN admite varios orígenes separados por coma
  corsOrigin: [
    ...(process.env.CORS_ORIGIN || '*')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  ],
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cacheTtlSegundos: enteroPositivo(process.env.CACHE_TTL_SEGUNDOS, 30),
  workerIntervaloMs: enteroPositivo(process.env.WORKER_INTERVALO_MS, 500),
  backendUrlParaWorker: process.env.BACKEND_URL_PARA_WORKER || 'http://localhost:3000',
};

module.exports = config;
