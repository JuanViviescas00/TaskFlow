import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRequestStore } from '../store/requestStore'
import { useSocket } from './useSocket'
import { useToast } from './useToast'

export function useRequests(autoLoad = true) {
  const store = useRequestStore()
  const toast = useToast()
  const searchTimeout = ref(null)

  // Escuchar eventos Socket.IO en tiempo real (HU-16)
  const eventos = {
    'solicitud-creada': (s) => {
      store.onSolicitudCreada(s)
      toast.info(`Nueva solicitud creada: "${s.titulo}"`, 'Solicitud Registrada')
    },
    'solicitud-encolada': (s) => {
      store.onSolicitudActualizada(s)
      toast.info(`Solicitud enviada a la cola Redis`, 'En cola')
    },
    'solicitud-procesando': (s) => {
      store.onSolicitudActualizada(s)
      toast.warning(`Worker procesando solicitud "${s.titulo}"`, 'Procesando')
    },
    'solicitud-respondida': (s) => {
      store.onSolicitudActualizada(s)
      toast.success(`Respuesta lista para "${s.titulo}"`, 'Solicitud Respondida')
    },
    'solicitud-error': (s) => {
      store.onSolicitudActualizada(s)
      toast.error(`Error en procesamiento de "${s.titulo}"`, 'Error')
    },
  }

  useSocket(eventos)

  // Búsqueda con debounce
  function onFilterChange() {
    clearTimeout(searchTimeout.value)
    searchTimeout.value = setTimeout(() => {
      store.cargarSolicitudes()
    }, 250)
  }

  let interval = null
  onMounted(() => {
    if (autoLoad) {
      store.cargarSolicitudes()
      store.cargarEstadisticas()
      // Intervalo de respaldo periódico por si cae la conexión socket
      interval = setInterval(() => {
        store.cargarEstadisticas()
      }, 15000)
    }
  })

  onUnmounted(() => {
    if (interval) clearInterval(interval)
    if (searchTimeout.value) clearTimeout(searchTimeout.value)
  })

  return {
    store,
    filtros: store.filtros,
    onFilterChange,
    recargar: () => store.cargarSolicitudes(),
  }
}
