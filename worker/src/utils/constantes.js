'use strict';

const ESTADOS = {
  PENDIENTE: 'PENDIENTE',
  EN_COLA: 'EN_COLA',
  PROCESANDO: 'PROCESANDO',
  RESPONDIDA: 'RESPONDIDA',
  ERROR: 'ERROR',
};

const ESTADOS_VALIDOS = Object.values(ESTADOS);
const CATEGORIAS = ['Información', 'Soporte', 'Documento', 'Consulta', 'Actualización'];
const PRIORIDADES = ['Baja', 'Media', 'Alta'];

const COLA_SOLICITUDES = 'cola:solicitudes';

const CACHE_PREFIX = {
  LISTADO: 'cache:solicitudes:listado',
  DETALLE: 'cache:solicitudes:detalle',
  ESTADISTICAS: 'cache:estadisticas',
  MONITOR: 'cache:monitor',
};

const EVENTOS_SOCKET = {
  SOLICITUD_CREADA: 'solicitud-creada',
  SOLICITUD_ENCOLADA: 'solicitud-encolada',
  SOLICITUD_PROCESANDO: 'solicitud-procesando',
  SOLICITUD_RESPONDIDA: 'solicitud-respondida',
  SOLICITUD_ERROR: 'solicitud-error',
  COLA_ACTUALIZADA: 'cola-actualizada',
  MONITOR_ACTUALIZADO: 'monitor-actualizado',
};

module.exports = {
  ESTADOS,
  ESTADOS_VALIDOS,
  CATEGORIAS,
  PRIORIDADES,
  COLA_SOLICITUDES,
  CACHE_PREFIX,
  EVENTOS_SOCKET,
};
