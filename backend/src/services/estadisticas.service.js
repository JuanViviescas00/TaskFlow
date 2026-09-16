'use strict';

const Solicitud = require('../models/Solicitud');
const queue = require('./queue.service');
const cache = require('./cache.service');
const config = require('../config/env');
const { CACHE_PREFIX, ESTADOS } = require('../utils/constantes');

// Indicadores para Dashboard y Monitor (HU-02, HU-09).
// Estadísticas con caché de TTL corto para demostrar CACHE HIT.

async function contarPorEstado() {
  const [pendientes, enCola, procesando, respondidas, errores, total] = await Promise.all([
    Solicitud.countDocuments({ estado: ESTADOS.PENDIENTE }),
    Solicitud.countDocuments({ estado: ESTADOS.EN_COLA }),
    Solicitud.countDocuments({ estado: ESTADOS.PROCESANDO }),
    Solicitud.countDocuments({ estado: ESTADOS.RESPONDIDA }),
    Solicitud.countDocuments({ estado: ESTADOS.ERROR }),
    Solicitud.countDocuments({}),
  ]);

  return {
    total,
    pendientes,
    enCola,
    procesando,
    respondidas,
    errores,
  };
}

// GET /api/estadisticas (con caché)
async function obtenerEstadisticas() {
  const enCache = await cache.obtener(CACHE_PREFIX.ESTADISTICAS);
  if (enCache) {
    return { datos: enCache, cacheHit: true };
  }
  const datos = await contarPorEstado();
  await cache.guardar(CACHE_PREFIX.ESTADISTICAS, datos, Math.min(config.cacheTtlSegundos, 10));
  return { datos, cacheHit: false };
}

// GET /api/monitor — siempre con datos frescos
async function obtenerMonitor() {
  const redis = require('../config/redis');
  const mongoose = require('mongoose');

  let mongoOk = false;
  try {
    mongoOk = mongoose.connection.readyState === 1;
  } catch {
    mongoOk = false;
  }

  let redisOk = false;
  try {
    const respuesta = await getClienteMonitor().ping();
    redisOk = respuesta === 'PONG';
  } catch {
    redisOk = false;
  }

  const enCola = await queue.tamano();
  const contadores = await contarPorEstado();
  const { obtenerEstadoWorker } = require('../sockets');

  return {
    servicios: {
      express: { disponible: true },
      mongodb: { disponible: mongoOk },
      redis: { disponible: redisOk },
      worker: { disponible: obtenerEstadoWorker().enLinea }, // señal del worker por Socket.IO
    },
    cola: enCola,
    ...contadores,
  };
}

function getClienteMonitor() {
  const { crearClienteRedis } = require('../config/redis');
  if (!getClienteMonitor._cliente) {
    getClienteMonitor._cliente = crearClienteRedis('monitor');
  }
  return getClienteMonitor._cliente;
}

async function cerrar() {
  if (getClienteMonitor._cliente) {
    await getClienteMonitor._cliente.quit().catch(() => getClienteMonitor._cliente.disconnect());
    getClienteMonitor._cliente = null;
  }
}

module.exports = { obtenerEstadisticas, obtenerMonitor, contarPorEstado, cerrar };
