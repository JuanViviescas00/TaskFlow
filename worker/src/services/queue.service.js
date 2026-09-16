'use strict';

const { COLA_SOLICITUDES } = require('../utils/constantes');

let cliente = null;

function getCliente() {
  if (!cliente) {
    const { crearClienteRedis } = require('../config/redis');
    cliente = crearClienteRedis('cola');
  }
  return cliente;
}

async function encolar(solicitudId) {
  await getCliente().lpush(COLA_SOLICITUDES, solicitudId);
}

async function desencolar(timeoutSegundos = 1) {
  const resultado = await getCliente().brpop(COLA_SOLICITUDES, timeoutSegundos);
  if (!resultado) return null;
  return Array.isArray(resultado) ? resultado[1] : resultado.element || null;
}

async function tamano() {
  try {
    return await getCliente().llen(COLA_SOLICITUDES);
  } catch {
    return 0;
  }
}

async function cerrar() {
  if (cliente) {
    await cliente.quit().catch(() => cliente.disconnect());
    cliente = null;
  }
}

module.exports = { encolar, desencolar, tamano, cerrar };
