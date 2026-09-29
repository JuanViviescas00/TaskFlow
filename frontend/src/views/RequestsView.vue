<script setup>
// Vista de Solicitudes moderna y limpia con barra de filtros horizontal
import { ref, onMounted, onUnmounted } from 'vue'
import { useRequestStore } from '../store/requestStore'
import { useSocket } from '../composables/useSocket'
import { useToast } from '../composables/useToast'
import RequestTable from '../components/requests/RequestTable.vue'
import CacheBadge from '../components/common/CacheBadge.vue'
import CacheModal from '../components/common/CacheModal.vue'
import { CATEGORIAS, ESTADOS, PRIORIDADES } from '../utils/format'

const store = useRequestStore()
const toast = useToast()

const modalCacheVisible = ref(false)
const debounceTimer = ref(null)

// Suscripción reactiva con Socket.IO (HU-16)
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
    toast.success(`Solicitud eliminada correctamente`, 'Operación exitosa')
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
    <!-- Encabezado de la página -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">Solicitudes</h2>
        <span class="count-tag">{{ store.total }} solicitudes</span>
      </div>

      <div class="header-actions">
        <!-- Indicador de Caché Redis vs MongoDB (HU-08) -->
        <CacheBadge :cache="store.listCache" :clickable="true" @click="modalCacheVisible = true" />

        <button
          type="button"
          class="btn-refresh"
          title="Actualizar listado"
          :disabled="store.cargando"
          @click="store.cargarSolicitudes()"
        >
          <span :class="{ 'spin-icon': store.cargando }">🔄</span>
          <span>Actualizar</span>
        </button>

        <RouterLink to="/solicitudes/nueva" class="btn-primary">
          ➕ Nueva Solicitud
        </RouterLink>
      </div>
    </div>

    <!-- Barra horizontal de filtros moderna -->
    <div class="toolbar-card">
      <div class="search-wrap">
        <span class="search-ico">🔍</span>
        <input
          v-model="store.filtros.q"
          type="search"
          placeholder="Buscar por título o descripción..."
          class="search-input"
          @input="onFilterChange"
        />
      </div>

      <div class="filters-wrap">
        <select
          v-model="store.filtros.estado"
          class="select-control"
          @change="onFilterChange"
        >
          <option value="">Todos los estados</option>
          <option v-for="e in ESTADOS" :key="e" :value="e">{{ e }}</option>
        </select>

        <select
          v-model="store.filtros.categoria"
          class="select-control"
          @change="onFilterChange"
        >
          <option value="">Todas las categorías</option>
          <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
        </select>

        <select
          v-model="store.filtros.prioridad"
          class="select-control"
          @change="onFilterChange"
        >
          <option value="">Todas las prioridades</option>
          <option v-for="p in PRIORIDADES" :key="p" :value="p">{{ p }}</option>
        </select>

        <button
          type="button"
          class="btn-reset"
          title="Restablecer filtros"
          @click="limpiarFiltros"
        >
          Limpiar
        </button>
      </div>
    </div>

    <div v-if="store.error" class="alerta error mb-4">
      <span class="alerta-icono">⚠️</span>
      <span>{{ store.error }}</span>
    </div>

    <!-- Tabla completa y espaciosa -->
    <RequestTable
      :solicitudes="store.solicitudes"
      :loading="store.cargando"
      @eliminar="eliminar"
    />

    <!-- Inspector Modal de Caché -->
    <CacheModal
      v-model:visible="modalCacheVisible"
      :cache="store.listCache"
      tipo="Listado de Solicitudes"
      cacheKey="solicitudes:listado"
      :onEjecutarPrueba="() => store.cargarSolicitudes()"
    />
  </div>
</template>

<style scoped>
.requests-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.count-tag {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-refresh:hover:not(:disabled) {
  background: #f8fafc;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #2563eb;
  color: #ffffff;
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.25);
  transition: all 0.15s;
}
.btn-primary:hover {
  background: #1d4ed8;
}

/* Barra horizontal de herramientas */
.toolbar-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.search-ico {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #f8fafc;
}

.search-input:focus {
  background: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.filters-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.select-control {
  padding: 8px 12px;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.86rem;
  color: #334155;
  outline: none;
  cursor: pointer;
}

.select-control:focus {
  border-color: #2563eb;
}

.btn-reset {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-reset:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.mb-4 {
  margin-bottom: 16px;
}

.spin-icon {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .toolbar-card {
    flex-direction: column;
    align-items: stretch;
  }
  .filters-wrap {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
