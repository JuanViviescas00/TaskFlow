<script setup>
// Dashboard profesional (doc §15.1): indicadores en tiempo real y flujo de procesamiento
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
    const [statsData, lista] = await Promise.all([obtenerEstadisticas(), listarSolicitudes({ limite: 6 })])
    stats.value = statsData
    recientes.value = lista.solicitudes
    error.value = ''
  } catch (e) {
    error.value = 'No se pudo conectar con el backend (puerto 3001).'
  } finally {
    cargando.value = false
  }
}

const hayActividad = computed(() => stats.value.enCola > 0 || stats.value.procesando > 0)

let temporizador = null
onMounted(() => {
  recargar()
  temporizador = setInterval(recargar, 10000)
})
onUnmounted(() => clearInterval(temporizador))
</script>

<template>
  <section class="vista">
    <header class="vista-header">
      <div>
        <h2>Dashboard</h2>
        <p>Visión general del sistema y flujo de solicitudes en tiempo real</p>
      </div>
      <RouterLink class="btn primario" to="/solicitudes/nueva">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nueva solicitud
      </RouterLink>
    </header>

    <div v-if="error" class="alerta error" role="alert">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ error }}</span>
    </div>

    <div v-if="cargando" class="cargando">
      <span class="spinner"></span>
      Cargando indicadores del sistema...
    </div>

    <template v-else>
      <div class="grid-stats">
        <StatCard etiqueta="Total" :valor="stats.total" color="azul" />
        <StatCard etiqueta="Pendientes" :valor="stats.pendientes" color="amarillo" />
        <StatCard etiqueta="En cola" :valor="stats.enCola" color="azul" />
        <StatCard etiqueta="Procesando" :valor="stats.procesando" color="morado" />
        <StatCard etiqueta="Respondidas" :valor="stats.respondidas" color="verde" />
        <StatCard etiqueta="Errores" :valor="stats.errores" color="rojo" />
      </div>

      <div v-if="hayActividad" class="alerta info" role="status">
        <span class="badge-dot pulse" style="background-color: var(--color-info);"></span>
        <span>Procesamiento activo en la cola Redis; las actualizaciones se sincronizan automáticamente vía WebSockets.</span>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Solicitudes recientes</h3>
            <span class="subtexto-header">Últimas solicitudes ingresadas al flujo</span>
          </div>
          <RouterLink to="/solicitudes" class="link-accion">
            Ver todas
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </RouterLink>
        </div>

        <div v-if="recientes.length === 0" class="vacio-box">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <p>Aún no hay solicitudes registradas en el sistema.</p>
          <RouterLink to="/solicitudes/nueva" class="btn mini primario" style="margin-top: 10px;">Crear la primera solicitud</RouterLink>
        </div>

        <div v-else class="tabla-contenedor">
          <table class="tabla">
            <thead>
              <tr>
                <th style="width: 100px;">ID</th>
                <th>Solicitud</th>
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha creación</th>
                <th style="text-align: right;">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in recientes" :key="s.id">
                <td class="mono">#{{ s.id.slice(-6) }}</td>
                <td class="celda-destacada">{{ s.titulo }}</td>
                <td>{{ s.categoria }}</td>
                <td>
                  <span class="prioridad-pill" :class="s.prioridad.toLowerCase()">{{ s.prioridad }}</span>
                </td>
                <td><EstadoBadge :estado="s.estado" /></td>
                <td class="texto-secundario">{{ formatDate(s.fechaCreacion) }}</td>
                <td style="text-align: right;">
                  <RouterLink class="btn mini" :to="`/solicitudes/${s.id}`">Ver</RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>
