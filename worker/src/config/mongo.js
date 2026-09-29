'use strict';

const mongoose = require('mongoose');
const config = require('./env');

const OPCIONES_ATLAS = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

async function conectarMongo() {
  await mongoose.connect(config.mongoUri, OPCIONES_ATLAS);
  console.log('[worker:mongo] Conectado a MongoDB Atlas');
}

async function desconectarMongo() {
  await mongoose.disconnect();
}

module.exports = { conectarMongo, desconectarMongo, mongoose };
