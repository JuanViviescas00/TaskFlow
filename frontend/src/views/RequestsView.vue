<script setup>
// Pantalla de solicitudes inspirada en la arquitectura visual de dos columnas de la referencia
import { ref, onMounted, onUnmounted } from 'vue'
import { useRequestStore } from '../store/requestStore'
import { useSocket } from '../composables/useSocket'
import { useToast } from '../composables/useToast'
import RequestTable from '../components/requests/RequestTable.vue'
import CacheBadge from '../components/common/CacheBadge.vue'
import { CATEGORIAS, ESTADOS, PRIORIDADES } from '../utils/format'

const store = useRequestStore()
const toast = useToast()

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
  <div class="page-container">
    <!-- Barra decorativa superior interna estilo tarjeta de referencia -->
    <div class="inner-banner-bar">
      <span>CATÁLOGO DE SOLICITUDES & TRÁMITES</span>
    </div>

    <!-- Contenedor principal estilo superficie clara de referencia -->
    <div class="main-surface-card">
      <!-- Encabezado con título grande e insignias -->
      <div class="surface-header">
        <div class="title-group">
          <h2 class="main-page-title">Mis Solicitudes</h2>
          <p class="main-page-sub">Consulta el estado en tiempo real y las respuestas generadas por el Worker</p>
        </div>

        <div class="surface-badges">
          <span class="count-pill">{{ store.total }} REGISTRADAS</span>
          <CacheBadge :cache="store.listCache" />
          <button
            type="button"
            class="btn-refresh-icon"
            title="Refrescar lista y probar caché"
            :disabled="store.cargando"
            @click="store.cargarSolicitudes()"
          >
            <span :class="{ 'spin-icon': store.cargando }">🔄</span>
          </button>
        </div>
      </div>

      <!-- Layout de dos columnas: Filtros a la izquierda, contenido a la derecha -->
      <div class="content-layout">
        <!-- Columna de Filtros estilo referencia -->
        <aside class="filters-sidebar">
          <div class="filters-box">
            <h3 class="filters-heading">FILTROS</h3>

            <div class="filter-field">
              <label class="filter-label">Buscar Solicitud</label>
              <input
                v-model="store.filtros.q"
                type="search"
                placeholder="Título o descripción..."
                class="filter-input"
                @input="onFilterChange"
              />
            </div>

            <div class="filter-field">
              <label class="filter-label">Categoría</label>
              <select
                v-model="store.filtros.categoria"
                class="filter-select"
                @change="onFilterChange"
              >
                <option value="">Todas las categorías</option>
                <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

            <div class="filter-field">
              <label class="filter-label">Estado de Procesamiento</label>
              <select
                v-model="store.filtros.estado"
                class="filter-select"
                @change="onFilterChange"
              >
                <option value="">Todos los estados</option>
                <option v-for="e in ESTADOS" :key="e" :value="e">{{ e }}</option>
              </select>
            </div>

            <div class="filter-field">
              <label class="filter-label">Prioridad</label>
              <select
                v-model="store.filtros.prioridad"
                class="filter-select"
                @change="onFilterChange"
              >
                <option value="">Todas las prioridades</option>
                <option v-for="p in PRIORIDADES" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>

            <button
              type="button"
              class="btn-clear-filters"
              @click="limpiarFiltros"
            >
              Limpiar filtros
            </button>
          </div>
        </aside>

        <!-- Columna de la tabla de solicitudes -->
        <main class="table-area">
          <div v-if="store.error" class="alerta error mb-4">
            <span class="alerta-icono">⚠️</span>
            <span>{{ store.error }}</span>
          </div>

          <RequestTable
            :solicitudes="store.solicitudes"
            :loading="store.cargando"
            @eliminar="eliminar"
          />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 1400px;
  margin: 0 auto;
}

/* Barra superior decorativa como en la referencia */
.inner-banner-bar {
  background: #0d3830;
  color: #86efac;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 10px 24px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Superficie principal */
.main-surface-card {
  background: #f4f7f6; /* Fondo suave claro como en la referencia */
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-top: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.surface-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.main-page-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: #0d3830; /* Tono oscuro profundo elegante */
  letter-spacing: -0.5px;
}

.main-page-sub {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 4px;
}

.surface-badges {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Pastilla de contador estilo '5 DISPONIBLES' */
.count-pill {
  background: #e2ece9;
  color: #0d3830;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #cbd5e1;
}

.btn-refresh-icon {
  background: white;
  border: 1px solid #cbd5e1;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-refresh-icon:hover {
  background: #f1f5f9;
}

/* Layout de dos columnas */
.content-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}

/* Panel de Filtros estilo referencia */
.filters-sidebar {
  width: 100%;
}

.filters-box {
  background: #e4eee9; /* Tinte suave verdoso/grisáceo como en la referencia */
  border: 1px solid #d1ded8;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.filters-heading {
  font-size: 0.78rem;
  font-weight: 800;
  color: #0d3830;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: #334155;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 9px 12px;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.88rem;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.filter-input:focus,
.filter-select:focus {
  border-color: #0d3830;
  box-shadow: 0 0 0 3px rgba(13, 56, 48, 0.15);
}

.btn-clear-filters {
  background: transparent;
  border: 1.5px solid #0d3830;
  color: #0d3830;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  margin-top: 4px;
}

.btn-clear-filters:hover {
  background: #0d3830;
  color: #ffffff;
}

/* Área de Tabla */
.table-area {
  min-width: 0;
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

@media (max-width: 960px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
}
</style>
