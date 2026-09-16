import { apiClient } from '../plugins/axios'

// Servicio central de comunicación con Express (doc §3.7).
// Operaciones: listar, detalle, crear, actualizar, eliminar,
// estadísticas y monitor. Incluye captura de X-Cache (HU-08).

export async function listarSolicitudes(filtros = {}) {
  const res = await apiClient.get('/api/solicitudes', { params: filtros })
  return {
    ...res.data,
    cache: res.headers['x-cache'] || 'MISS',
  }
}

export async function obtenerSolicitud(id) {
  const { data, headers } = await apiClient.get(`/api/solicitudes/${id}`)
  return { data, cache: headers['x-cache'] || 'MISS' }
}

export async function crearSolicitud(payload) {
  const { data } = await apiClient.post('/api/solicitudes', payload)
  return data
}

export async function actualizarSolicitud(id, payload) {
  const { data } = await apiClient.put(`/api/solicitudes/${id}`, payload)
  return data
}

export async function eliminarSolicitud(id) {
  const { data } = await apiClient.delete(`/api/solicitudes/${id}`)
  return data
}

export async function obtenerEstadisticas() {
  const res = await apiClient.get('/api/estadisticas')
  return {
    ...res.data,
    cache: res.headers['x-cache'] || 'MISS',
  }
}

export async function obtenerMonitor() {
  const { data } = await apiClient.get('/api/monitor')
  return data
}

