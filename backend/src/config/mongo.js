'use strict';

const mongoose = require('mongoose');
const config = require('./env');

// Opciones recomendadas para MongoDB Atlas (TLS habilitado por la URI)
const OPCIONES_ATLAS = {
  serverSelectionTimeoutMS: 10000, // 10s para detectar fallo de conexión rápido
  socketTimeoutMS: 45000,
};

async function conectarMongo() {
  await mongoose.connect(config.mongoUri, OPCIONES_ATLAS);
  console.log(`[mongo] Conectado a MongoDB Atlas`);
}

async function desconectarMongo() {
  await mongoose.disconnect();
}

module.exports = { conectarMongo, desconectarMongo, mongoose };
