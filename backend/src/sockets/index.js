'use strict';

const { Server } = require('socket.io');
const config = require('../config/env');
const { EVENTOS_WORKER_A_BACKEND } = require('../utils/constantes');

// Socket.IO (doc §21): notificaciones en tiempo real hacia el frontend.
// REST sigue siendo el mecanismo principal de datos (doc §21.5).

let io = null;

// Estado del worker, alimentado por suscripción y heartbeat (doc §21.5)
let estadoWorker = { enLinea: false, ultimaSenal: null, id: null };
const LATIDO_MAXIMO_MS = 15000; // sin señal por 15s => fuera de línea

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[socket] Cliente conectado: ${socket.id}`);
    // El worker se identifica con este mensaje; a partir de ahí se relevarán
    // sus eventos a todos los navegadores (doc §21.5).
    socket.on('worker:suscribir', () => {
      socket.__esWorker = true;
      estadoWorker = { enLinea: true, ultimaSenal: Date.now(), id: socket.id };
      registrarRelevoWorker(socket);
    });
    // Latido periódico del worker para el Monitor (HU-09, HU-16)
    socket.on('worker:heartbeat', () => {
      if (socket.__esWorker) estadoWorker.ultimaSenal = Date.now();
    });
    socket.on('disconnect', () => {
      if (socket.__esWorker) {
        estadoWorker = { enLinea: false, ultimaSenal: estadoWorker.ultimaSenal, id: null };
      }
      console.log(`[socket] Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

// Emite un evento a todos los clientes conectados
function emitir(evento, datos) {
  if (io) {
    io.emit(evento, datos);
  }
}

function getIo() {
  return io;
}

// Estado del worker para /api/monitor: en línea si hay señal reciente
function obtenerEstadoWorker() {
  const reciente = estadoWorker.ultimaSenal && Date.now() - estadoWorker.ultimaSenal < LATIDO_MAXIMO_MS;
  return { ...estadoWorker, enLinea: Boolean(estadoWorker.id) && Boolean(reciente) };
}

// El Worker se conecta como cliente de Socket.IO y este backend
// retransmite sus eventos a los navegadores (doc §21.5).
function registrarRelevoWorker(workerSocket) {
  if (workerSocket.__relevoActivo) return; // evitar handlers duplicados
  workerSocket.__relevoActivo = true;
  for (const evento of EVENTOS_WORKER_A_BACKEND) {
    workerSocket.on(evento, (datos) => {
      emitir(evento, datos);
    });
  }
  console.log(`[socket] Worker ${workerSocket.id} registrado: sus eventos se retransmiten a los navegadores`);
}

module.exports = { initSocket, emitir, getIo, registrarRelevoWorker, obtenerEstadoWorker };
