'use strict';

require('dotenv').config({ override: true });

function enteroPositivo(valor, defecto) {
  const n = parseInt(valor, 10);
  return Number.isFinite(n) && n > 0 ? n : defecto;
}

const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cacheTtlSegundos: enteroPositivo(process.env.CACHE_TTL_SEGUNDOS, 30),
  workerIntervaloMs: enteroPositivo(process.env.WORKER_INTERVALO_MS, 500),
  backendUrlParaWorker: process.env.BACKEND_URL_PARA_WORKER || 'http://localhost:3000',
};

module.exports = config;
