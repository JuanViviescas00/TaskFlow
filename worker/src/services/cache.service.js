'use strict';

const { CACHE_PREFIX } = require('../utils/constantes');

let cliente = null;

function getCliente() {
  if (!cliente) {
    const { crearClienteRedis } = require('../config/redis');
    cliente = crearClienteRedis('cache');
  }
  return cliente;
}

async function invalidarPatron(patron) {
  try {
    const claves = await getCliente().keys(patron);
    if (claves.length > 0) {
      await getCliente().del(...claves);
    }
  } catch (err) {
    console.error(`[worker:cache] Error al invalidar patrón ${patron}: ${err.message}`);
  }
}

async function invalidarSolicitudes() {
  await Promise.all([
    invalidarPatron(`${CACHE_PREFIX.LISTADO}:*`),
    invalidarPatron(`${CACHE_PREFIX.DETALLE}:*`),
  ]);
  try {
    await getCliente().del(CACHE_PREFIX.ESTADISTICAS);
  } catch (err) {
    console.error(`[worker:cache] Error al invalidar estadísticas: ${err.message}`);
  }
}

async function cerrar() {
  if (cliente) {
    await cliente.quit().catch(() => cliente.disconnect());
    cliente = null;
  }
}

module.exports = { invalidarSolicitudes, cerrar };
