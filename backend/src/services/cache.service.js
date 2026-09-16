'use strict';

const config = require('../config/env');
const { CACHE_PREFIX } = require('../utils/constantes');

// Servicio de caché sobre Redis (taller §13.1).
// Toda lectura externa puede identificarse como CACHE HIT (vino de Redis)
// o CACHE MISS (se fue a MongoDB). Ante fallo de Redis se degrada a MongoDB.

let cliente = null;

function getCliente() {
  if (!cliente) {
    const { crearClienteRedis } = require('../config/redis');
    cliente = crearClienteRedis('cache');
  }
  return cliente;
}

async function obtener(clave) {
  try {
    const data = await getCliente().get(clave);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`[cache] Error al leer ${clave}: ${err.message}`);
    return null; // ante fallo de caché, seguimos con MongoDB
  }
}

async function guardar(clave, valor, ttlSegundos = config.cacheTtlSegundos) {
  try {
    await getCliente().set(clave, JSON.stringify(valor), 'EX', ttlSegundos);
  } catch (err) {
    console.error(`[cache] Error al guardar ${clave}: ${err.message}`);
  }
}

function listadoClave(filtros) {
  return `${CACHE_PREFIX.LISTADO}:${JSON.stringify(filtros)}`;
}

function detalleClave(id) {
  return `${CACHE_PREFIX.DETALLE}:${id}`;
}

async function invalidarPatron(patron) {
  try {
    const claves = await getCliente().keys(patron);
    if (claves.length > 0) {
      await getCliente().del(...claves);
    }
  } catch (err) {
    console.error(`[cache] Error al invalidar patrón ${patron}: ${err.message}`);
  }
}

// Invalida listado, detalles y estadísticas cuando cambian los datos
async function invalidarSolicitudes() {
  await Promise.all([
    invalidarPatron(`${CACHE_PREFIX.LISTADO}:*`),
    invalidarPatron(`${CACHE_PREFIX.DETALLE}:*`),
  ]);
  try {
    await getCliente().del(CACHE_PREFIX.ESTADISTICAS);
  } catch (err) {
    console.error(`[cache] Error al invalidar estadísticas: ${err.message}`);
  }
}

async function cerrar() {
  if (cliente) {
    await cliente.quit().catch(() => cliente.disconnect());
    cliente = null;
  }
}

module.exports = {
  obtener,
  guardar,
  listadoClave,
  detalleClave,
  invalidarSolicitudes,
  cerrar,
};
