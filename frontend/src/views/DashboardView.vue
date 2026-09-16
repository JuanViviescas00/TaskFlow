<script setup>
// Dashboard (doc §15.1): indicadores en tiempo real + solicitudes recientes.
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { obtenerEstadisticas, listarSolicitudes } from '../services/requestService'
import { useSocket } from '../composables/useSocket'
import StatCard from '../components/StatCard.vue'
import EstadoBadge from '../components/EstadoBadge.vue'
import { formatDate } from '../utils/format'

const stats = ref({ total: 0, pendientes: 0, enCola: 0, procesando: 0, respondidas: 0, errores: 0 })
const recientes = ref([])
const cargando = ref(true)
const error = ref('')

const eventos = {
  'solicitud-creada': () => recargar(),
  'solicitud-encolada': () => recargar(),
  'solicitud-procesando': () => recargar(),
  'solicitud-respondida': () => recargar(),
  'solicitud-error': () => recargar(),
}
useSocket(eventos)

async function recargar() {
  try {
    const [statsData, lista] = await Promise.all([obtenerEstadisticas(), listarSolicitudes({ limite: 5 })])
    stats.value = statsData
    recientes.value = lista.solicitudes
    error.value = ''
  } catch (e) {
    error.value = 'No se pudo conectar con el backend (¿está corriendo en el puerto 3001?).'
  } finally {
    cargando.value = false
  }
}

const hayActividad = computed(() => stats.value.enCola > 0 || stats.value.procesando > 0)

let temporizador = null
onMounted(() => {
  recargar()
  temporizador = setInterval(recargar, 10000) // respaldo si no hay socket
})
onUnmounted(() => clearInterval(temporizador))
</script>

<template>
  <section class="vista">
    <header class="vista-header">
      <div>
        <h2>Dashboard</h2>
        <p>Visión general del sistema en tiempo real</p>
      </div>
      <RouterLink class="btn primario" to="/solicitudes/nueva">➕ Nueva solicitud</RouterLink>
    </header>

    <p v-if="error" class="alerta error">{{ error }}</p>

    <div v-if="cargando" class="cargando">Cargando indicadores...</div>

    <template v-else>
      <div class="grid-stats">
        <StatCard etiqueta="Total" :valor="stats.total" color="azul" />
        <StatCard etiqueta="Pendientes" :valor="stats.pendientes" color="amarillo" />
        <StatCard etiqueta="En cola" :valor="stats.enCola" color="azul" />
        <StatCard etiqueta="Procesando" :valor="stats.procesando" color="morado" />
        <StatCard etiqueta="Respondidas" :valor="stats.respondidas" color="verde" />
        <StatCard etiqueta="Errores" :valor="stats.errores" color="rojo" />
      </div>

      <p v-if="hayActividad" class="alerta info">
        ⏳ Hay solicitudes siendo procesadas; los cambios aparecen automáticamente.
      </p>

      <div class="panel">
        <div class="panel-header">
          <h3>Solicitudes recientes</h3>
          <RouterLink to="/solicitudes">Ver todas →</RouterLink>
        </div>
        <p v-if="recientes.length === 0" class="vacio">Aún no hay solicitudes registradas.</p>
        <table v-else class="tabla">
          <thead>
            <tr>
              <th>ID</th><th>Solicitud</th><th>Categoría</th><th>Prioridad</th><th>Estado</th><th>Fecha</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in recientes" :key="s.id">
              <td class="mono">{{ s.id.slice(-6) }}</td>
              <td>{{ s.titulo }}</td>
              <td>{{ s.categoria }}</td>
              <td>{{ s.prioridad }}</td>
              <td><EstadoBadge :estado="s.estado" /></td>
              <td>{{ formatDate(s.fechaCreacion) }}</td>
              <td><RouterLink class="btn mini" :to="`/solicitudes/${s.id}`">Ver detalle</RouterLink></td>
            </tr>
        </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
