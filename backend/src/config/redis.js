'use strict';

const Redis = require('ioredis');
const config = require('./env');

function crearClienteRedis(nombre) {
  const cliente = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 200, 5000),
    lazyConnect: false,
  });

  cliente.on('connect', () => console.log(`[redis:${nombre}] Conectado: ${config.redisUrl}`));
  cliente.on('error', (err) => console.error(`[redis:${nombre}] Error: ${err.message}`));

  return cliente;
}

module.exports = { crearClienteRedis };
