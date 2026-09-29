<script setup>
// Listado de solicitudes (doc §15.3): filtros avanzados, estados reactivos y operaciones
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { listarSolicitudes, eliminarSolicitud } from '../services/requestService'
import { useSocket } from '../composables/useSocket'
import EstadoBadge from '../components/EstadoBadge.vue'
import { formatDate, CATEGORIAS, ESTADOS, PRIORIDADES } from '../utils/format'

const solicitudes = ref([])
const total = ref(0)
const cargando = ref(true)
const error = ref('')
const mensaje = ref('')

const filtros = ref({ q: '', estado: '', categoria: '', prioridad: '' })

const eventos = {
  'solicitud-creada': recargar,
  'solicitud-encolada': recargar,
  'solicitud-procesando': recargar,
  'solicitud-respondida': recargar,
  'solicitud-error': recargar,
}
useSocket(eventos)

let temporizador = null
async function recargar() {
  try {
    const params = {}
    for (const [k, v] of Object.entries(filtros.value)) {
      if (v) params[k] = v
    }
    const data = await listarSolicitudes(params)
    solicitudes.value = data.solicitudes
    total.value = data.total
    error.value = ''
  } catch (e) {
    error.value = 'Error al consultar las solicitudes con el backend.'
  } finally {
    cargando.value = false
  }
}

watch(filtros, recargar, { deep: true })

async function eliminar(s) {
  mensaje.value = ''
  if (!confirm(`¿Estás seguro de eliminar la solicitud "${s.titulo}"?`)) return
  try {
    await eliminarSolicitud(s.id)
    mensaje.value = 'Solicitud eliminada correctamente.'
    recargar()
  } catch {
    error.value = 'No se pudo eliminar la solicitud.'
  }
}

function limpiarFiltros() {
  filtros.value = { q: '', estado: '', categoria: '', prioridad: '' }
}

onMounted(() => {
  recargar()
  temporizador = setInterval(recargar, 15000)
})
onUnmounted(() => clearInterval(temporizador))
</script>

<template>
  <section class="vista">
    <header class="vista-header">
      <div>
        <h2>Solicitudes</h2>
        <p>{{ total }} solicitud(es) registrada(s) en el sistema</p>
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
      <span>{{ error }}</span>
    </div>
    <div v-if="mensaje" class="alerta ok" role="status">
      <span>{{ mensaje }}</span>
    </div>

    <!-- Barra de filtros del espacio XY -->
    <div class="filtros">
      <div class="filtro-busqueda-wrap">
        <svg class="icono-busqueda" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          v-model="filtros.q" 
          type="search" 
          placeholder="Buscar por título o descripción..." 
          aria-label="Buscar solicitudes"
        />
      </div>

      <select v-model="filtros.estado" aria-label="Filtrar por estado">
        <option value="">Todos los estados</option>
        <option v-for="e in ESTADOS" :key="e" :value="e">{{ e }}</option>
      </select>

      <select v-model="filtros.categoria" aria-label="Filtrar por categoría">
        <option value="">Todas las categorías</option>
        <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
      </select>

      <select v-model="filtros.prioridad" aria-label="Filtrar por prioridad">
        <option value="">Todas las prioridades</option>
        <option v-for="p in PRIORIDADES" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>

    <div v-if="cargando" class="cargando">
      <span class="spinner"></span>
      Cargando solicitudes...
    </div>

    <div v-else class="panel">
      <div v-if="solicitudes.length === 0" class="vacio-box">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <p>No se encontraron solicitudes con los filtros aplicados.</p>
        <button class="btn mini" @click="limpiarFiltros" style="margin-top: 10px;">Limpiar filtros de búsqueda</button>
      </div>

      <div v-else class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th style="width: 90px;">ID</th>
              <th>Solicitud</th>
              <th>Categoría</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th style="text-align: right; width: 140px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in solicitudes" :key="s.id">
              <td class="mono">#{{ s.id.slice(-6) }}</td>
              <td class="celda-destacada">{{ s.titulo }}</td>
              <td>{{ s.categoria }}</td>
              <td>
                <span class="prioridad-pill" :class="s.prioridad.toLowerCase()">{{ s.prioridad }}</span>
              </td>
              <td><EstadoBadge :estado="s.estado" /></td>
              <td class="texto-secundario">{{ formatDate(s.fechaCreacion) }}</td>
              <td style="text-align: right;">
                <div class="acciones-celda" style="justify-content: flex-end;">
                  <RouterLink class="btn mini" :to="`/solicitudes/${s.id}`">Ver</RouterLink>
                  <button class="btn mini peligro" @click="eliminar(s)" title="Eliminar solicitud">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
