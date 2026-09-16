'use strict';

const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { conectarMongo, desconectarMongo } = require('./config/mongo');
const { initSocket } = require('./sockets');
const queue = require('./services/queue.service');

// Bootstrap del backend: MongoDB + HTTP + Socket.IO.

async function main() {
  await conectarMongo();

  const server = http.createServer(app);
  initSocket(server);

  // Verificación temprana de Redis (caché y cola)
  await queue.tamano();

  server.listen(config.port, config.host, () => {
    console.log(`[backend] TASKFLOW API escuchando en http://${config.host}:${config.port}`);
    console.log('[backend] Endpoints: /api/solicitudes, /api/estadisticas, /api/monitor, /health');
  });

  async function apagar(señal) {
    console.log(`\n[backend] Apagando (${señal})...`);
    server.close();
    await Promise.allSettled([desconectarMongo(), queue.cerrar()]);
    process.exit(0);
  }

  process.on('SIGINT', () => apagar('SIGINT'));
  process.on('SIGTERM', () => apagar('SIGTERM'));
}

main().catch((err) => {
  console.error('[backend] Error al iniciar:', err.message);
  process.exit(1);
});
