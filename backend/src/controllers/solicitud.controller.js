'use strict';

const service = require('../services/solicitud.service');
const estadisticasService = require('../services/estadisticas.service');

// Controladores: reciben las peticiones y coordinan las operaciones (taller §12).

function extraerFiltros(query) {
  const filtros = {};
  for (const clave of ['estado', 'categoria', 'prioridad', 'q', 'limite', 'pagina']) {
    if (query[clave] !== undefined && query[clave] !== '') {
      filtros[clave] = query[clave];
    }
  }
  return filtros;
}

async function listar(req, res, next) {
  try {
    const { datos, cacheHit } = await service.listarSolicitudes(extraerFiltros(req.query));
    res.set('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.json(datos);
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const resultado = await service.obtenerPorId(req.params.id);
    if (!resultado) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }
    res.set('X-Cache', resultado.cacheHit ? 'HIT' : 'MISS');
    res.json(resultado.datos);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const solicitud = await service.crearSolicitud(req.body || {});
    res.status(201).json({
      mensaje: 'Solicitud registrada y enviada a la cola de procesamiento.',
      solicitud,
    });
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const solicitud = await service.actualizarSolicitud(req.params.id, req.body || {});
    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }
    res.json({ mensaje: 'Solicitud actualizada.', solicitud });
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    const solicitud = await service.eliminarSolicitud(req.params.id);
    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }
    res.json({ mensaje: 'Solicitud eliminada.', solicitud });
  } catch (err) {
    next(err);
  }
}

async function estadisticas(_req, res, next) {
  try {
    const { datos, cacheHit } = await estadisticasService.obtenerEstadisticas();
    res.set('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.json(datos);
  } catch (err) {
    next(err);
  }
}

async function monitor(_req, res, next) {
  try {
    const datos = await estadisticasService.obtenerMonitor();
    res.json(datos);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, estadisticas, monitor };
