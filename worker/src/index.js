'use strict';

require('dotenv').config();

const { conectarMongo, desconectarMongo } = require('./config/mongo');
const { crearClienteRedis } = require('./config/redis');
const queue = require('./services/queue.service');
const cache = require('./services/cache.service');
const { io: ClientIO } = require('socket.io-client');
const { ESTADOS, EVENTOS_SOCKET } = require('./utils/constantes');
const { generarRespuesta } = require('./utils/reglasRespuesta');
const Solicitud = require('./models/Solicitud');
const config = require('./config/env');

const backendUrl = config.backendUrlParaWorker;
let socketBackend = null;

function conectarBackend() {
  socketBackend = ClientIO(backendUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socketBackend.on('connect', () => {
    console.log(`[worker] Conectado al backend por Socket.IO: ${backendUrl}`);
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

  // 1. Cambiar estado a PROCESANDO
  solicitud.estado = ESTADOS.PROCESANDO;
  await solicitud.save();
  await cache.invalidarSolicitudes();
  notificar(EVENTOS_SOCKET.SOLICITUD_PROCESANDO, solicitud.toJSON());

  try {
    // Retardo visual deliberado para que el cambio de estado se aprecie en la interfaz
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulación de error controlado si contiene palabra clave [ERROR] (Prueba #7 del taller)
    if (
      (solicitud.titulo && solicitud.titulo.includes('[ERROR]')) ||
      (solicitud.descripcion && solicitud.descripcion.includes('[ERROR]'))
    ) {
      throw new Error('Fallo simulado por palabra clave [ERROR] en la solicitud');
    }

    // 2. Generar respuesta por categoría
    const respuesta = generarRespuesta(solicitud.categoria);

    // 3. Guardar respuesta y pasar a RESPONDIDA
    solicitud.estado = ESTADOS.RESPONDIDA;
    solicitud.respuesta = respuesta;
    solicitud.fechaProcesamiento = new Date();
    solicitud.mensajeError = null;
    await solicitud.save();
    await cache.invalidarSolicitudes();

    notificar(EVENTOS_SOCKET.SOLICITUD_RESPONDIDA, solicitud.toJSON());
    console.log(`[worker] Solicitud ${idSolicitud} RESPONDIDA exitosamente.`);
  } catch (err) {
    console.error(`[worker] Error al procesar solicitud ${idSolicitud}: ${err.message}`);
    solicitud.estado = ESTADOS.ERROR;
    solicitud.mensajeError = `Fallo en procesamiento: ${err.message}`;
    await solicitud.save().catch(() => null);
    await cache.invalidarSolicitudes().catch(() => null);

    notificar(EVENTOS_SOCKET.SOLICITUD_ERROR, solicitud.toJSON());
  }
}

async function main() {
  console.log('[worker] Iniciando TASKFLOW Worker independiente...');
  await conectarMongo();
  const redis = crearClienteRedis('worker');
  await redis.ping();
  conectarBackend();

  let apagando = false;
  let procesadas = 0;

  // Latido periódico cada 5s para que el Monitor lo muestre en línea (HU-09, HU-16)
  const latido = setInterval(() => {
    if (socketBackend && socketBackend.connected) {
      socketBackend.emit('worker:heartbeat');
    }
  }, 5000);

  // Bucle principal de consumo de la cola
  while (!apagando) {
    try {
      const idSolicitud = await queue.desencolar(1);
      if (idSolicitud) {
        await procesarSolicitud(idSolicitud);
        procesadas += 1;
        notificar(EVENTOS_SOCKET.COLA_ACTUALIZADA, { enCola: await queue.tamano() });
      } else {
        if (procesadas > 0 && procesadas % 10 === 0) {
          notificar(EVENTOS_SOCKET.MONITOR_ACTUALIZADO, { worker: 'activo', procesadas });
        }
        await new Promise((resolve) => setTimeout(resolve, config.workerIntervaloMs));
      }
    } catch (err) {
      console.error(`[worker] Error en bucle principal: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async function apagar(senal) {
    console.log(`\n[worker] Apagando (${senal})...`);
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
