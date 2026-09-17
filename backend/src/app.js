'use strict';

const express = require('express');
const cors = require('cors');
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

// Healthcheck simple para Docker/monitor
app.get('/health', (_req, res) => {
  res.json({ estado: 'ok', servicio: 'taskflow-backend' });
});

app.use('/api', rutas);

// 404 controlado para rutas desconocidas
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use(errorHandler);

module.exports = app;
