'use strict';

const { COLA_SOLICITUDES } = require('../utils/constantes');

// Servicio de cola sobre Redis (taller §13.2).
// Usa una lista Redis: lPush para encolar, brPop para consumir.
// Si el Worker está detenido, los elementos permanecen en la cola (HU-04).

let cliente = null;

function getCliente() {
  if (!cliente) {
    const { crearClienteRedis } = require('../config/redis');
    cliente = crearClienteRedis('cola');
  }
  return cliente;
}

// Encola el id de una solicitud
async function encolar(solicitudId) {
  await getCliente().lpush(COLA_SOLICITUDES, solicitudId);
}

// Consume un id de la cola (bloqueante con timeout en segundos)
async function desencolar(timeoutSegundos = 1) {
  const resultado = await getCliente().brpop(COLA_SOLICITUDES, timeoutSegundos);
  if (!resultado) return null;
  return Array.isArray(resultado) ? resultado[1] : resultado.element || null;
}

// Cantidad de solicitudes pendientes en la cola
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
