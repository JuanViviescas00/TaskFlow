<script setup>
// Listado de solicitudes (doc §15.3, HU-02, HU-08, HU-16)
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRequestStore } from '../store/requestStore'
import { useSocket } from '../composables/useSocket'
import { useToast } from '../composables/useToast'
import RequestTable from '../components/requests/RequestTable.vue'
import CacheBadge from '../components/common/CacheBadge.vue'
import { CATEGORIAS, ESTADOS, PRIORIDADES } from '../utils/format'

const store = useRequestStore()
const toast = useToast()

const debounceTimer = ref(null)

// Suscripción a eventos Socket.IO para recarga reactiva (HU-16)
const eventos = {
  'solicitud-creada': () => store.cargarSolicitudes(),
  'solicitud-encolada': () => store.cargarSolicitudes(),
  'solicitud-procesando': () => store.cargarSolicitudes(),
  'solicitud-respondida': () => store.cargarSolicitudes(),
  'solicitud-error': () => store.cargarSolicitudes(),
}
useSocket(eventos)

function onFilterChange() {
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    store.cargarSolicitudes()
  }, 250)
}

function limpiarFiltros() {
  store.filtros.q = ''
  store.filtros.estado = ''
  store.filtros.categoria = ''
  store.filtros.prioridad = ''
  store.cargarSolicitudes()
}

async function eliminar(s) {
  if (!confirm(`¿Estás seguro de eliminar la solicitud "${s.titulo}"?`)) return
  try {
    await store.remover(s.id)
    toast.success(`Solicitud #${s.id ? s.id.slice(-6) : ''} eliminada`, 'Operación exitosa')
  } catch {
    toast.error('No se pudo eliminar la solicitud.', 'Error')
  }
}

let temporizador = null
onMounted(() => {
  store.cargarSolicitudes()
  temporizador = setInterval(() => store.cargarSolicitudes(), 15000)
})

onUnmounted(() => {
  if (temporizador) clearInterval(temporizador)
  if (debounceTimer.value) clearTimeout(debounceTimer.value)
})
</script>

<template>
  <div class="requests-page">
    <div class="page-top-bar">
      <div>
        <h1 class="page-heading">Mis Solicitudes</h1>
        <p class="page-subheading">
          Total de solicitudes: <strong>{{ store.total }}</strong>
        </p>
      </div>

      <div class="top-actions">
        <!-- Indicador de Caché en tiempo real para la prueba de HU-08 -->
        <CacheBadge :cache="store.listCache" />

        <button
          type="button"
          class="btn-refresh"
          title="Refrescar datos y verificar caché"
          :disabled="store.cargando"
          @click="store.cargarSolicitudes()"
        >
          <span :class="{ 'spin-icon': store.cargando }">🔄</span>
          <span>Actualizar</span>
        </button>

        <RouterLink to="/solicitudes/nueva" class="btn-primary-action">
          ➕ Nueva solicitud
        </RouterLink>
      </div>
    </div>

    <!-- Barra de Filtros -->
    <div class="filters-card">
      <div class="search-field">
        <span class="search-icon">🔍</span>
        <input
          v-model="store.filtros.q"
          type="search"
          placeholder="Buscar por título o descripción..."
          class="search-input"
          @input="onFilterChange"
        />
      </div>

      <div class="select-filters">
        <select
          v-model="store.filtros.estado"
          class="filter-select"
          @change="onFilterChange"
        >
          <option value="">Todos los estados</option>
          <option v-for="e in ESTADOS" :key="e" :value="e">{{ e }}</option>
        </select>

        <select
          v-model="store.filtros.categoria"
          class="filter-select"
          @change="onFilterChange"
        >
          <option value="">Todas las categorías</option>
          <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
        </select>

        <select
          v-model="store.filtros.prioridad"
          class="filter-select"
          @change="onFilterChange"
        >
          <option value="">Todas las prioridades</option>
          <option v-for="p in PRIORIDADES" :key="p" :value="p">{{ p }}</option>
        </select>

        <button
          type="button"
          class="btn-clear"
          title="Limpiar todos los filtros"
          @click="limpiarFiltros"
        >
          Limpiar
        </button>
      </div>
    </div>

    <div v-if="store.error" class="alerta error">
      <span class="alerta-icono">⚠️</span>
      <span>{{ store.error }}</span>
    </div>

    <!-- Tabla de Solicitudes -->
    <RequestTable
      :solicitudes="store.solicitudes"
      :loading="store.cargando"
      @eliminar="eliminar"
    />
  </div>
</template>

<style scoped>
.requests-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.page-heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.page-subheading {
  font-size: 0.88rem;
  color: #64748b;
  margin-top: 2px;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: white;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-refresh:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.spin-icon {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

.btn-primary-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #2563eb;
  color: white;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  transition: all 0.2s;
}
.btn-primary-action:hover {
  background: #1d4ed8;
}

.filters-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.search-field {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.95rem;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 40px;
  font-size: 0.92rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #f8fafc;
}

.search-input:focus {
  background: white;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.select-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 140px;
  padding: 8px 12px;
  font-size: 0.88rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  background: white;
  color: #334155;
  outline: none;
}

.filter-select:focus {
  border-color: #2563eb;
}

.btn-clear {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-clear:hover {
  background: #e2e8f0;
  color: #1e293b;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
