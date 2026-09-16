'use strict';

require('dotenv').config();

const { conectarMongo, desconectarMongo } = require('../config/mongo');
const { crearClienteRedis } = require('../config/redis');
const queue = require('../services/queue.service');
const cache = require('../services/cache.service');
const { registrarRelevoWorker } = require('../sockets/index');
const { io: ClientIO } = require('socket.io-client');
const { EVENTOS_SOCKET, EVENTOS_WORKER_A_BACKEND } = require('../utils/constantes');

// WORKER independiente (doc §8 y taller §14):
// 1. Espera solicitudes en la cola Redis
// 2. Obtiene el id y consulta la solicitud en MongoDB
// 3. Cambia el estado a PROCESANDO
// 4. Identifica la categoría y aplica la regla de respuesta
// 5. Genera y guarda la respuesta en MongoDB
// 6. Cambia el estado a RESPONDIDA
// Ante cualquier error: estado ERROR + mensajeError, sin detener el Worker (HU-11).

const config = require('../config/env');

const backendUrl = config.backendUrlParaWorker;
let socketBackend = null;

// Conexión Socket.IO al backend para notificar en tiempo real (doc §21.5).
// El backend retransmite estos eventos al navegador.
function conectarBackend() {
  socketBackend = ClientIO(backendUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socketBackend.on('connect', () => {
    console.log(`[worker] Conectado al backend por Socket.IO: ${backendUrl}`);
    // avisa al backend (una sola vez) que relevará los eventos de este worker
    socketBackend.emit('worker:suscribir');
  });

  socketBackend.on('disconnect', () => {
    console.warn('[worker] Desconectado del backend; reintentando...');
  });

  socketBackend.on('connect_error', (err) => {
    console.warn(`[worker] Sin conexión al backend (${err.message}); el procesamiento continúa.`);
  });

  return socketBackend;
}

function notificar(evento, datos) {
  if (socketBackend && socketBackend.connected) {
    socketBackend.emit(evento, datos);
  }
}

async function procesarSolicitud(idSolicitud) {
  const Solicitud = require('../models/Solicitud');
  const { generarRespuesta } = require('../utils/reglasRespuesta');
  const { ESTADOS } = require('../utils/constantes');
  const service = require('../services/solicitud.service');

  console.log(`[worker] Procesando solicitud ${idSolicitud}`);

  const solicitud = await Solicitud.findById(idSolicitud);
  if (!solicitud) {
    console.warn(`[worker] Solicitud ${idSolicitud} no existe en MongoDB; se descarta.`);
    return;
  }
  if (solicitud.estado === ESTADOS.RESPONDIDA) {
    console.log(`[worker] Solicitud ${idSolicitud} ya estaba respondida; se ignora.`);
    return;
  }

  // Cambiar estado a PROCESANDO
  await service.actualizarEstado(idSolicitud, ESTADOS.PROCESANDO);
  notificar(
    EVENTOS_SOCKET.SOLICITUD_PROCESANDO,
    solicitudConEstado(solicitud, ESTADOS.PROCESANDO)
  );

  try {
    // Pequeña espera para que el cambio de estado sea visible en la demo
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Identificar categoría → aplicar regla → generar respuesta
    const respuesta = generarRespuesta(solicitud.categoria);

    // Guardar respuesta en MongoDB y pasar a RESPONDIDA
    const actualizada = await service.actualizarEstado(idSolicitud, ESTADOS.RESPONDIDA, {
      respuesta,
      fechaProcesamiento: new Date(),
      mensajeError: null,
    });

    notificar(EVENTOS_SOCKET.SOLICITUD_RESPONDIDA, actualizada.toJSON());
    console.log(`[worker] Solicitud ${idSolicitud} RESPONDIDA`);
  } catch (err) {
    console.error(`[worker] Error procesando ${idSolicitud}: ${err.message}`);
    const conError = await service
      .actualizarEstado(idSolicitud, ESTADOS.ERROR, {
        mensajeError: `No fue posible procesar la solicitud: ${err.message}`,
      })
      .catch(() => null);
    if (conError) {
      notificar(EVENTOS_SOCKET.SOLICITUD_ERROR, conError.toJSON());
    }
  }
}

function solicitudConEstado(solicitud, estado) {
  return { ...solicitud.toJSON(), estado };
}

async function main() {
  console.log('[worker] Iniciando TASKFLOW Worker...');
  await conectarMongo();
  const redis = crearClienteRedis('worker');
  await redis.ping();
  conectarBackend();

  let apagando = false;
  let procesadas = 0;

  // Latido periódico para que el Monitor muestre al worker en línea (HU-09, HU-16)
  const latido = setInterval(() => {
    if (socketBackend && socketBackend.connected) {
      socketBackend.emit('worker:heartbeat');
    }
  }, 5000);

  // Bucle principal: consume la cola de forma continua
  while (!apagando) {
    try {
      const idSolicitud = await queue.desencolar(1);
      if (idSolicitud) {
        await procesarSolicitud(idSolicitud);
        procesadas += 1;
        notificar(EVENTOS_SOCKET.COLA_ACTUALIZADA, { enCola: await queue.tamano() });
      } else {
        // sin solicitudes: latido para el monitor
        if (procesadas > 0 && procesadas % 10 === 0) {
          notificar(EVENTOS_SOCKET.MONITOR_ACTUALIZADO, { worker: 'activo', procesadas });
        }
        await new Promise((resolve) => setTimeout(resolve, config.workerIntervaloMs));
      }
    } catch (err) {
      console.error(`[worker] Error en el bucle principal: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async function apagar(señal) {
    console.log(`\n[worker] Apagando (${señal})...`);
    apagando = true;
    clearInterval(latido);
    await Promise.allSettled([
      desconectarMongo(),
      queue.cerrar(),
      cache.cerrar(),
      new Promise((resolve) => {
        if (socketBackend) socketBackend.close();
        resolve();
      }),
      new Promise((resolve) => {
        redis.quit().catch(() => redis.disconnect());
        resolve();
      }),
    ]);
    process.exit(0);
  }

  process.on('SIGINT', () => apagar('SIGINT'));
  process.on('SIGTERM', () => apagar('SIGTERM'));
}

main().catch((err) => {
  console.error('[worker] Error fatal al iniciar:', err.message);
  process.exit(1);
});
