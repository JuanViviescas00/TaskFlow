import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  listarSolicitudes,
  obtenerSolicitud,
  crearSolicitud,
  actualizarSolicitud,
  eliminarSolicitud,
  obtenerEstadisticas,
  obtenerMonitor,
} from '../services/requestService'

export const useRequestStore = defineStore('requests', () => {
  // Estado
  const solicitudes = ref([])
  const total = ref(0)
  const solicitudActual = ref(null)
  const listCache = ref('')
  const detailCache = ref('')
  const statsCache = ref('')
  const stats = ref({
    total: 0,
    pendientes: 0,
    enCola: 0,
    procesando: 0,
    respondidas: 0,
    errores: 0,
  })
  const monitor = ref(null)
  const cargando = ref(false)
  const error = ref('')

  const filtros = ref({
    q: '',
    estado: '',
    categoria: '',
    prioridad: '',
  })

  // Getters
  const hayActividad = computed(
    () => stats.value.enCola > 0 || stats.value.procesando > 0
  )

  // Acciones
  async function cargarEstadisticas() {
    try {
      const data = await obtenerEstadisticas()
      stats.value = {
        total: data.total ?? 0,
        pendientes: data.pendientes ?? 0,
        enCola: data.enCola ?? 0,
        procesando: data.procesando ?? 0,
        respondidas: data.respondidas ?? 0,
        errores: data.errores ?? 0,
      }
      statsCache.value = data.cache || 'MISS'
    } catch (e) {
      console.error('Error al obtener estadísticas:', e)
    }
  }

  async function cargarSolicitudes(paramsOverride = null) {
    cargando.value = true
    try {
      const params = {}
      const f = paramsOverride || filtros.value
      for (const [k, v] of Object.entries(f)) {
        if (v) params[k] = v
      }
      const data = await listarSolicitudes(params)
      solicitudes.value = data.solicitudes || []
      total.value = data.total ?? 0
      listCache.value = data.cache || 'MISS'
      error.value = ''
    } catch (e) {
      error.value = 'Error al consultar las solicitudes.'
      console.error(e)
    } finally {
      cargando.value = false
    }
  }

  async function cargarDetalle(id) {
    cargando.value = true
    try {
      const { data, cache } = await obtenerSolicitud(id)
      solicitudActual.value = data
      detailCache.value = cache
      error.value = ''
      return data
    } catch (e) {
      error.value =
        e.response?.status === 404
          ? 'La solicitud no existe o fue eliminada.'
          : 'Error al consultar el detalle de la solicitud.'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function registrar(payload) {
    const data = await crearSolicitud(payload)
    await cargarEstadisticas()
    return data
  }

  async function actualizar(id, payload) {
    const data = await actualizarSolicitud(id, payload)
    return data
  }

  async function remover(id) {
    const data = await eliminarSolicitud(id)
    await cargarSolicitudes()
    await cargarEstadisticas()
    return data
  }

  async function cargarMonitor() {
    try {
      monitor.value = await obtenerMonitor()
    } catch (e) {
      console.error('Error al consultar monitor:', e)
    }
  }

  // Manejo de eventos reactivos del Socket.IO
  function onSolicitudCreada(s) {
    cargarEstadisticas()
    // Si estamos en listado, refrescar
    if (solicitudes.value.length > 0) {
      cargarSolicitudes()
    }
  }

  function onSolicitudActualizada(s) {
    cargarEstadisticas()
    // Actualizar en lista local si está presente
    const idx = solicitudes.value.findIndex((item) => item.id === s.id)
    if (idx !== -1) {
      solicitudes.value[idx] = { ...solicitudes.value[idx], ...s }
    }
    // Actualizar detalle si coincide
    if (solicitudActual.value && solicitudActual.value.id === s.id) {
      solicitudActual.value = { ...solicitudActual.value, ...s }
    }
  }

  return {
    solicitudes,
    total,
    solicitudActual,
    listCache,
    detailCache,
    statsCache,
    stats,
    monitor,
    cargando,
    error,
    filtros,
    hayActividad,
    cargarEstadisticas,
    cargarSolicitudes,
    cargarDetalle,
    registrar,
    actualizar,
    remover,
    cargarMonitor,
    onSolicitudCreada,
    onSolicitudActualizada,
  }
})
