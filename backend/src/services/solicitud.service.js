'use strict';

const mongoose = require('mongoose');
const Solicitud = require('../models/Solicitud');
const cache = require('./cache.service');
const queue = require('./queue.service');
const { emitir } = require('../sockets');
const {
  ESTADOS,
  CATEGORIAS,
  PRIORIDADES,
  EVENTOS_SOCKET,
} = require('../utils/constantes');

// Servicio de solicitudes: validación y lógica de negocio (taller §12).

class ErrorValidacion extends Error {
  constructor(mensaje, detalles = []) {
    super(mensaje);
    this.name = 'ErrorValidacion';
    this.status = 400;
    this.detalles = detalles;
  }
}

function crearErrorValidacion(mensaje, detalles) {
  return new ErrorValidacion(mensaje, detalles);
}

function escapeRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function esIdValido(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Valida y normaliza los datos de entrada (HU-01)
function validarDatosSolicitud(datos, { parcial = false } = {}) {
  const errores = [];
  const limpios = {};

  if (!parcial || datos.titulo !== undefined) {
    const titulo = typeof datos.titulo === 'string' ? datos.titulo.trim() : '';
    if (!titulo) {
      errores.push('El título es obligatorio.');
    } else if (titulo.length > 120) {
      errores.push('El título no puede superar 120 caracteres.');
    } else {
      limpios.titulo = titulo;
    }
  }

  if (!parcial || datos.descripcion !== undefined) {
    const descripcion = typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '';
    if (!descripcion) {
      errores.push('La descripción es obligatoria.');
    } else if (descripcion.length > 2000) {
      errores.push('La descripción no puede superar 2000 caracteres.');
    } else {
      limpios.descripcion = descripcion;
    }
  }

  if (!parcial || datos.categoria !== undefined) {
    if (!CATEGORIAS.includes(datos.categoria)) {
      errores.push(`La categoría debe ser una de: ${CATEGORIAS.join(', ')}.`);
    } else {
      limpios.categoria = datos.categoria;
    }
  }

  if (datos.prioridad !== undefined) {
    if (!PRIORIDADES.includes(datos.prioridad)) {
      errores.push(`La prioridad debe ser una de: ${PRIORIDADES.join(', ')}.`);
    } else {
      limpios.prioridad = datos.prioridad;
    }
  }

  if (errores.length > 0) {
    throw crearErrorValidacion('Datos inválidos.', errores);
  }
  return limpios;
}

// Listado con filtros y caché (HU-02 y HU-08)
async function listarSolicitudes(filtros = {}) {
  const clave = cache.listadoClave(filtros);
  const enCache = await cache.obtener(clave);
  if (enCache) {
    return { datos: enCache, cacheHit: true };
  }

  const criterio = {};
  if (filtros.estado) criterio.estado = filtros.estado;
  if (filtros.categoria) criterio.categoria = filtros.categoria;
  if (filtros.prioridad) criterio.prioridad = filtros.prioridad;
  if (filtros.q) {
    const regex = new RegExp(escapeRegex(filtros.q), 'i');
    criterio.$or = [{ titulo: regex }, { descripcion: regex }];
  }

  const limite = Math.min(parseInt(filtros.limite || '100', 10) || 100, 200);
  const pagina = Math.max(parseInt(filtros.pagina || '1', 10) || 1, 1);

  const [solicitudes, total] = await Promise.all([
    Solicitud.find(criterio)
      .sort({ fechaCreacion: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite),
    Solicitud.countDocuments(criterio),
  ]);

  const respuesta = {
    total,
    pagina,
    limite,
    solicitudes: solicitudes.map((s) => s.toJSON()),
  };
  await cache.guardar(clave, respuesta);
  return { datos: respuesta, cacheHit: false };
}

// Detalle con caché (HU-03 y HU-08)
async function obtenerPorId(id) {
  if (!esIdValido(id)) {
    return null;
  }
  const clave = cache.detalleClave(id);
  const enCache = await cache.obtener(clave);
  if (enCache) {
    return { datos: enCache, cacheHit: true };
  }

  const solicitud = await Solicitud.findById(id);
  if (!solicitud) {
    return null;
  }
  const datos = solicitud.toJSON();
  await cache.guardar(clave, datos);
  return { datos, cacheHit: false };
}

// Registro + envío a la cola (HU-01 y HU-04)
async function crearSolicitud(datos) {
  const datosLimpios = validarDatosSolicitud(datos);

  let solicitud = await Solicitud.create({
    ...datosLimpios,
    estado: ESTADOS.PENDIENTE,
  });
  emitir(EVENTOS_SOCKET.SOLICITUD_CREADA, solicitud.toJSON());

  await queue.encolar(solicitud._id.toString());

  solicitud = await Solicitud.findByIdAndUpdate(
    solicitud._id,
    { estado: ESTADOS.EN_COLA },
    { new: true }
  );
  emitir(EVENTOS_SOCKET.SOLICITUD_ENCOLADA, solicitud.toJSON());

  await cache.invalidarSolicitudes();
  return solicitud.toJSON();
}

// Edición básica solo antes del procesamiento
async function actualizarSolicitud(id, datos) {
  if (!esIdValido(id)) {
    return null;
  }
  const existente = await Solicitud.findById(id);
  if (!existente) {
    return null;
  }
  if (![ESTADOS.PENDIENTE, ESTADOS.ERROR].includes(existente.estado)) {
    throw crearErrorValidacion(
      `No se puede editar una solicitud en estado ${existente.estado}.`
    );
  }

  const datosLimpios = validarDatosSolicitud(datos, { parcial: true });
  const solicitud = await Solicitud.findByIdAndUpdate(id, datosLimpios, {
    new: true,
  });

  await cache.invalidarSolicitudes();
  return solicitud.toJSON();
}

async function eliminarSolicitud(id) {
  if (!esIdValido(id)) {
    return null;
  }
  const solicitud = await Solicitud.findByIdAndDelete(id);
  if (!solicitud) {
    return null;
  }
  await cache.invalidarSolicitudes();
  return solicitud.toJSON();
}

// Actualización de estado reutilizable por el Worker
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

module.exports = {
  ErrorValidacion,
  crearErrorValidacion,
  validarDatosSolicitud,
  listarSolicitudes,
  obtenerPorId,
  crearSolicitud,
  actualizarSolicitud,
  eliminarSolicitud,
  actualizarEstado,
};
