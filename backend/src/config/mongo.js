'use strict';

const mongoose = require('mongoose');
const config = require('./env');

async function conectarMongo() {
  await mongoose.connect(config.mongoUri);
  console.log(`[mongo] Conectado: ${config.mongoUri}`);
}

async function desconectarMongo() {
  await mongoose.disconnect();
}

module.exports = { conectarMongo, desconectarMongo, mongoose };
