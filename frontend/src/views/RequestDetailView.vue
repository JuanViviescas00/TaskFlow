<script setup>
// Detalle de solicitud (doc §15.4): datos, estado y respuesta en vivo (HU-03, HU-16).
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { obtenerSolicitud } from '../services/requestService'
import { useSocket } from '../composables/useSocket'
import EstadoBadge from '../components/EstadoBadge.vue'
import { formatDate } from '../utils/format'

const route = useRoute()
const solicitud = ref(null)
const cache = ref('')
const cargando = ref(true)
const error = ref('')

async function cargar() {
  try {
    const { data, cache: cacheHeader } = await obtenerSolicitud(route.params.id)
    // solo actualizar cache si la solicitud no cambió de estado
    if (!solicitud.value || solicitud.value.estado === data.estado) {
      cache.value = cacheHeader
    }
    solicitud.value = data
    error.value = ''
  } catch (e) {
    error.value = e.response?.status === 404
      ? 'La solicitud no existe o fue eliminada.'
      : 'Error al consultar la solicitud.'
  } finally {
    cargando.value = false
  }
}

const eventos = {
  'solicitud-procesando': (s) => { if (s.id === solicitud.value?.id) solicitud.value = s },
  'solicitud-respondida': (s) => { if (s.id === solicitud.value?.id) { solicitud.value = s; cache.value = '' } },
  'solicitud-error': (s) => { if (s.id === solicitud.value?.id) solicitud.value = s },
}
useSocket(eventos)

onMounted(cargar)

const tieneRespuesta = computed(() => Boolean(solicitud.value?.respuesta))
const tieneError = computed(() => Boolean(solicitud.value?.mensajeError))
</script>

<template>
  <section class="vista estrecha">
    <header class="vista-header">
      <div>
        <h2>Detalle de solicitud</h2>
        <p class="mono">#{{ route.params.id }}</p>
      </div>
      <RouterLink class="btn" to="/solicitudes">← Volver</RouterLink>
    </header>

    <div v-if="cargando" class="cargando">Cargando solicitud...</div>
    <p v-else-if="error" class="alerta error">{{ error }}</p>

    <template v-else-if="solicitud">
      <div class="panel">
        <div class="fila-datos">
          <div><span class="etiqueta">Título</span><strong>{{ solicitud.titulo }}</strong></div>
          <div><span class="etiqueta">Estado</span><EstadoBadge :estado="solicitud.estado" /></div>
        </div>
        <div class="fila-datos">
          <div><span class="etiqueta">Categoría</span>{{ solicitud.categoria }}</div>
          <div><span class="etiqueta">Prioridad</span>{{ solicitud.prioridad }}</div>
        </div>
        <div class="fila-datos">
          <div><span class="etiqueta">Creada</span>{{ formatDate(solicitud.fechaCreacion) }}</div>
          <div><span class="etiqueta">Procesada</span>{{ formatDate(solicitud.fechaProcesamiento) }}</div>
        </div>
        <div>
          <span class="etiqueta">Descripción</span>
          <p class="descripcion">{{ solicitud.descripcion }}</p>
        </div>
      </div>

      <div v-if="tieneRespuesta" class="panel respuesta">
        <h3>Respuesta generada</h3>
        <p>{{ solicitud.respuesta }}</p>
      </div>

      <div v-if="tieneError" class="panel error-panel">
        <h3>⚠️ Error de procesamiento</h3>
        <p>{{ solicitud.mensajeError }}</p>
      </div>

      <p class="nota-cache">
        Consulta atendida por: <strong>{{ cache === 'HIT' ? 'caché Redis (HIT)' : 'MongoDB (MISS)' }}</strong>
      </p>
    </template>
  </section>
</template>
