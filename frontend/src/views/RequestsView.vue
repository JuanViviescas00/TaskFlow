<script setup>
// Listado de solicitudes (doc §15.3): filtros, estados y acciones (HU-02, HU-08).
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { listarSolicitudes, eliminarSolicitud } from '../services/requestService'
import { useSocket } from '../composables/useSocket'
import EstadoBadge from '../components/EstadoBadge.vue'
import { formatDate, CATEGORIAS, ESTADOS, PRIORIDADES } from '../utils/format'

const solicitudes = ref([])
const total = ref(0)
const cargando = ref(true)
const error = ref('')
const cache = ref('')
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
    error.value = 'Error al consultar las solicitudes.'
  } finally {
    cargando.value = false
  }
}

watch(filtros, recargar, { deep: true })

async function eliminar(s) {
  mensaje.value = ''
  if (!confirm(`¿Eliminar la solicitud "${s.titulo}"?`)) return
  try {
    await eliminarSolicitud(s.id)
    mensaje.value = 'Solicitud eliminada.'
    recargar()
  } catch {
    error.value = 'No se pudo eliminar la solicitud.'
  }
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
        <p>{{ total }} solicitud(es) encontrada(s)</p>
      </div>
      <RouterLink class="btn primario" to="/solicitudes/nueva">➕ Nueva</RouterLink>
    </header>

    <p v-if="error" class="alerta error">{{ error }}</p>
    <p v-if="mensaje" class="alerta ok">{{ mensaje }}</p>

    <div class="panel filtros">
      <input v-model="filtros.q" type="search" placeholder="🔍 Buscar por título o descripción..." />
      <select v-model="filtros.estado">
        <option value="">Todos los estados</option>
        <option v-for="e in ESTADOS" :key="e" :value="e">{{ e }}</option>
      </select>
      <select v-model="filtros.categoria">
        <option value="">Todas las categorías</option>
        <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="filtros.prioridad">
        <option value="">Todas las prioridades</option>
        <option v-for="p in PRIORIDADES" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>

    <div v-if="cargando" class="cargando">Cargando solicitudes...</div>

    <div v-else class="panel">
      <p v-if="solicitudes.length === 0" class="vacio">
        No hay solicitudes que coincidan con los filtros.
      </p>
      <table v-else class="tabla">
        <thead>
          <tr>
            <th>ID</th><th>Solicitud</th><th>Categoría</th><th>Prioridad</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in solicitudes" :key="s.id">
            <td class="mono">{{ s.id.slice(-6) }}</td>
            <td>{{ s.titulo }}</td>
            <td>{{ s.categoria }}</td>
            <td>{{ s.prioridad }}</td>
            <td><EstadoBadge :estado="s.estado" /></td>
            <td>{{ formatDate(s.fechaCreacion) }}</td>
            <td class="acciones-celda">
              <RouterLink class="btn mini" :to="`/solicitudes/${s.id}`">Ver</RouterLink>
              <button class="btn mini peligro" @click="eliminar(s)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
