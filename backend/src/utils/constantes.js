'use strict';

// Estados del ciclo de vida de una solicitud (doc §13)
const ESTADOS = {
  PENDIENTE: 'PENDIENTE',
  EN_COLA: 'EN_COLA',
  PROCESANDO: 'PROCESANDO',
  RESPONDIDA: 'RESPONDIDA',
  ERROR: 'ERROR',
};

const ESTADOS_VALIDOS = Object.values(ESTADOS);

// Categorías sugeridas (doc §14)
const CATEGORIAS = ['Información', 'Soporte', 'Documento', 'Consulta', 'Actualización'];

// Prioridades
const PRIORIDADES = ['Baja', 'Media', 'Alta'];

// Cola de Redis
const COLA_SOLICITUDES = 'cola:solicitudes';

// Prefijos de caché
const CACHE_PREFIX = {
  LISTADO: 'cache:solicitudes:listado',
  DETALLE: 'cache:solicitudes:detalle',
  ESTADISTICAS: 'cache:estadisticas',
  MONITOR: 'cache:monitor',
};

// Eventos Socket.IO (doc §21.3)
const EVENTOS_SOCKET = {
  SOLICITUD_CREADA: 'solicitud-creada',
  SOLICITUD_ENCOLADA: 'solicitud-encolada',
  SOLICITUD_PROCESANDO: 'solicitud-procesando',
  SOLICITUD_RESPONDIDA: 'solicitud-respondida',
  SOLICITUD_ERROR: 'solicitud-error',
  COLA_ACTUALIZADA: 'cola-actualizada',
  MONITOR_ACTUALIZADO: 'monitor-actualizado',
};

// Eventos que el Worker envía al backend para que los retransmita
const EVENTOS_WORKER_A_BACKEND = [
  EVENTOS_SOCKET.SOLICITUD_PROCESANDO,
  EVENTOS_SOCKET.SOLICITUD_RESPONDIDA,
  EVENTOS_SOCKET.SOLICITUD_ERROR,
  EVENTOS_SOCKET.COLA_ACTUALIZADA,
  EVENTOS_SOCKET.MONITOR_ACTUALIZADO,
];

module.exports = {
  ESTADOS,
  ESTADOS_VALIDOS,
  CATEGORIAS,
  PRIORIDADES,
  COLA_SOLICITUDES,
  CACHE_PREFIX,
  EVENTOS_SOCKET,
  EVENTOS_WORKER_A_BACKEND,
};
