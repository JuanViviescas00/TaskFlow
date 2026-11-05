'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config/env');
const rutas = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

// Aplicación Express (doc §4): CORS, JSON, rutas y manejo de errores.

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    exposedHeaders: ['X-Cache'],
  })
);
app.use(express.json({ limit: '1mb' }));

// Healthcheck simple para Docker/Render/monitor
app.get('/health', (_req, res) => {
  res.json({ estado: 'ok', servicio: 'taskflow-backend' });
});

// Rutas de la API bajo el prefijo canónico /api
app.use('/api', rutas);

// Servir frontend compilado de Vue si existe la carpeta dist (entorno producción / contenedor unificado)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  // Soporte para Vue Router (HTML5 History Mode) en navegación web
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // En desarrollo sin build estático de Vue, expone las rutas también en la raíz (doc §5)
  app.use('/', rutas);

  // 404 controlado para rutas desconocidas
  app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
  });
}

app.use(errorHandler);

module.exports = app;
