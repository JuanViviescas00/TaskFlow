'use strict';

const Redis = require('ioredis');
const config = require('./env');

function crearClienteRedis(nombre) {
  const esTls = config.redisUrl && config.redisUrl.startsWith('rediss://');
  const opciones = {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 200, 5000),
    lazyConnect: false,
  };

  if (esTls) {
    opciones.tls = { rejectUnauthorized: false };
  }

  const cliente = new Redis(config.redisUrl, opciones);

  cliente.on('connect', () => console.log(`[redis:${nombre}] Conectado: ${config.redisUrl}`));
  cliente.on('error', (err) => console.error(`[redis:${nombre}] Error: ${err.message || err.code || 'Sin conexión a Redis'}`));

  return cliente;
}

module.exports = { crearClienteRedis };
