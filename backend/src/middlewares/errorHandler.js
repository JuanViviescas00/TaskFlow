'use strict';

// Middleware central de manejo de errores (taller §12).
// Devuelve siempre JSON controlado: { error, detalles? }.

const { ErrorValidacion } = require('../services/solicitud.service');

function errorHandler(err, _req, res, _next) {
  if (err instanceof ErrorValidacion) {
    return res.status(400).json({
      error: err.message,
      detalles: err.detalles,
    });
  }

  // Body JSON malformado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido.' });
  }

  console.error('[error]', err.message);
  return res.status(err.status || 500).json({
    error: 'Error interno del servidor.',
  });
}

module.exports = errorHandler;
