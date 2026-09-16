'use strict';

const mongoose = require('mongoose');
const { ESTADOS_VALIDOS, CATEGORIAS, PRIORIDADES } = require('../utils/constantes');

const solicitudSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    categoria: {
      type: String,
      required: true,
      enum: CATEGORIAS,
    },
    prioridad: {
      type: String,
      required: true,
      enum: PRIORIDADES,
      default: 'Media',
    },
    estado: {
      type: String,
      required: true,
      enum: ESTADOS_VALIDOS,
      default: 'PENDIENTE',
      index: true,
    },
    respuesta: {
      type: String,
      default: null,
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
      index: true,
    },
    fechaProcesamiento: {
      type: Date,
      default: null,
    },
    mensajeError: {
      type: String,
      default: null,
    },
  },
  {
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Solicitud', solicitudSchema);
