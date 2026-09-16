'use strict';

require('dotenv').config();

const { conectarMongo, desconectarMongo } = require('./config/mongo');
const { crearClienteRedis } = require('./config/redis');
const queue = require('./services/queue.service');
const cache = require('./services/cache.service');
const { io: ClientIO } = require('socket.io-client');
const { EVENTOS_SOCKET, ESTADOS } = require('./utils/constantes');
const { generarRespuesta } = require('./utils/reglasRespuesta');
const Solicitud = require('./models/Solicitud');
const config = require('./config/env');

const backendUrl = config.backendUrlParaWorker;
let socketBackend = null;

// Conexión Socket.IO hacia el backend para notificaciones en vivo
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

async function actualizarEstado(id, estado, camposExtra = {}) {
  const solicitud = await Solicitud.findByIdAndUpdate(
    id,
    { estado, ...camposExtra },
    { new: true }
  );
  if (solicitud) {
    await cache.invalidarSolicitudes();
  }
  return solicitud;
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
  const enProceso = await actualizarEstado(idSolicitud, ESTADOS.PROCESANDO);
  notificar(EVENTOS_SOCKET.SOLICITUD_PROCESANDO, enProceso.toJSON());

  try {
    // Pausa pedagógica para que el cambio de estado se aprecie en vivo
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulación de error controlado para la Prueba Obligatoria #7 del taller
    if (
      (solicitud.titulo && solicitud.titulo.toUpperCase().includes('[ERROR]')) ||
      (solicitud.descripcion && solicitud.descripcion.toUpperCase().includes('[ERROR]'))
    ) {
      throw new Error('Fallo provocado para demostración pedagógica (Prueba #7 del taller).');
    }

    // 2. Identificar categoría y generar respuesta según reglas
    const respuesta = generarRespuesta(solicitud.categoria);

    // 3. Guardar en MongoDB y pasar a RESPONDIDA
    const actualizada = await actualizarEstado(idSolicitud, ESTADOS.RESPONDIDA, {
      respuesta,
      fechaProcesamiento: new Date(),
      mensajeError: null,
    });

    notificar(EVENTOS_SOCKET.SOLICITUD_RESPONDIDA, actualizada.toJSON());
    console.log(`[worker] Solicitud ${idSolicitud} RESPONDIDA con éxito`);
  } catch (err) {
    console.error(`[worker] Error procesando ${idSolicitud}: ${err.message}`);
    const conError = await actualizarEstado(idSolicitud, ESTADOS.ERROR, {
      mensajeError: `No fue posible procesar la solicitud: ${err.message}`,
      fechaProcesamiento: new Date(),
    }).catch(() => null);

    if (conError) {
      notificar(EVENTOS_SOCKET.SOLICITUD_ERROR, conError.toJSON());
    }
  }
}

async function main() {
  console.log('[worker] ==========================================');
  console.log('[worker] Iniciando TASKFLOW Worker independiente...');
  console.log('[worker] ==========================================');

  await conectarMongo();
  const redis = crearClienteRedis('worker');
  await redis.ping();
  conectarBackend();

  let apagando = false;
  let procesadas = 0;

  // Latido para que el monitor detecte al Worker en línea
  const latido = setInterval(() => {
    if (socketBackend && socketBackend.connected) {
      socketBackend.emit('worker:heartbeat');
    }
  }, 5000);

  // Bucle de consumo continuo de la cola Redis
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
