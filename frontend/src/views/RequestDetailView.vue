<script setup>
// Detalle de solicitud limpio y moderno
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRequestStore } from '../store/requestStore'
import { useSocket } from '../composables/useSocket'
import { useToast } from '../composables/useToast'
import EstadoBadge from '../components/EstadoBadge.vue'
import CacheBadge from '../components/common/CacheBadge.vue'
import CacheModal from '../components/common/CacheModal.vue'
import ResponsePanel from '../components/requests/ResponsePanel.vue'
import { formatDate } from '../utils/format'

const route = useRoute()
const store = useRequestStore()
const toast = useToast()

const solicitud = ref(null)
const cacheHeader = ref('MISS')
const cargando = ref(true)
const actualizandoCache = ref(false)
const error = ref('')
const modalCacheVisible = ref(false)

async function cargarDetalle(mostrarSpinner = true) {
  if (mostrarSpinner) cargando.value = true
  else actualizandoCache.value = true
  try {
    const data = await store.cargarDetalle(route.params.id)
    solicitud.value = data
    cacheHeader.value = store.detailCache
    error.value = ''
    return { cache: cacheHeader.value }
  } catch (e) {
    error.value = store.error || 'No se pudo cargar la solicitud.'
    throw e
  } finally {
    if (mostrarSpinner) cargando.value = false
    else actualizandoCache.value = false
  }
}

function abrirModalCache() {
  modalCacheVisible.value = true
}

async function testearCache() {
  abrirModalCache()
}

const eventos = {
  'solicitud-procesando': (s) => {
    if (s.id === route.params.id) {
      solicitud.value = s
      toast.warning('El Worker está procesando esta solicitud', 'En proceso')
    }
  },
  'solicitud-respondida': (s) => {
    if (s.id === route.params.id) {
      solicitud.value = s
      toast.success('¡Respuesta generada con éxito!', 'Respondida')
    }
  },
  'solicitud-error': (s) => {
    if (s.id === route.params.id) {
      solicitud.value = s
      toast.error('Ocurrió un error en el procesamiento', 'Error')
    }
  },
}
useSocket(eventos)

onMounted(cargarDetalle)
</script>

<template>
  <div class="detail-container">
    <div class="page-header">
      <div>
        <div class="breadcrumb">
          <RouterLink to="/solicitudes">Solicitudes</RouterLink>
          <span>/</span>
          <span>Detalle</span>
        </div>
        <h2 class="page-title">
          Solicitud <span class="id-mono">#{{ route.params.id ? route.params.id.slice(-6) : '' }}</span>
        </h2>
      </div>

      <div class="header-actions">
        <!-- Indicador de Caché Redis vs Mongo (HU-08) -->
        <CacheBadge :cache="cacheHeader" :clickable="true" @click="abrirModalCache" />
        <button
          type="button"
          class="btn-cache"
          title="Abrir inspector para probar CACHE HIT / CACHE MISS"
          :disabled="cargando || actualizandoCache"
          @click="abrirModalCache"
        >
          <span :class="{ 'spin-icon': actualizandoCache }">⚡</span>
          <span>Probar Caché</span>
        </button>
        <RouterLink to="/solicitudes" class="btn-back">
          ← Volver
        </RouterLink>
      </div>
    </div>

    <div v-if="cargando" class="loading-box">
      <div class="spinner"></div>
      <p>Consultando solicitud...</p>
    </div>

    <div v-else-if="error" class="alerta error">
      <span class="alerta-icono">⚠️</span>
      <span>{{ error }}</span>
    </div>

    <template v-else-if="solicitud">
      <!-- Explicación pedagógica de la Caché (HU-08) -->
      <div class="cache-callout" :class="cacheHeader === 'HIT' ? 'hit' : 'miss'">
        <span class="callout-ico">{{ cacheHeader === 'HIT' ? '⚡' : '💾' }}</span>
        <div>
          <strong>Consulta atendida por: {{ cacheHeader === 'HIT' ? 'CACHE HIT (Redis)' : 'CACHE MISS (MongoDB)' }}</strong>
          <p v-if="cacheHeader === 'HIT'">
            Se recuperó inmediatamente de la memoria RAM de <strong>Redis</strong> sin realizar consultas lentas a MongoDB.
          </p>
          <p v-else>
            La información se leyó de la base de datos persistente <strong>MongoDB</strong> y quedó almacenada temporalmente en Redis.
          </p>
        </div>
      </div>

      <!-- Ficha de Datos -->
      <div class="data-card">
        <div class="card-header-row">
          <div>
            <h3 class="item-title">{{ solicitud.titulo }}</h3>
            <span class="item-id">ID: <code>{{ solicitud.id }}</code></span>
          </div>
          <EstadoBadge :estado="solicitud.estado" />
        </div>

        <div class="fields-grid">
          <div class="field-col">
            <span class="lbl">Categoría</span>
            <span class="val bold">{{ solicitud.categoria }}</span>
          </div>
          <div class="field-col">
            <span class="lbl">Prioridad</span>
            <span class="val">{{ solicitud.prioridad }}</span>
          </div>
          <div class="field-col">
            <span class="lbl">Creada</span>
            <span class="val">{{ formatDate(solicitud.fechaCreacion) }}</span>
          </div>
          <div class="field-col">
            <span class="lbl">Procesada</span>
            <span class="val">{{ solicitud.fechaProcesamiento ? formatDate(solicitud.fechaProcesamiento) : 'En espera' }}</span>
          </div>
        </div>

        <div class="desc-box">
          <span class="lbl">Descripción</span>
          <p class="desc-text">{{ solicitud.descripcion }}</p>
        </div>
      </div>

      <!-- Panel de Respuesta o Error -->
      <ResponsePanel
        :estado="solicitud.estado"
        :respuesta="solicitud.respuesta"
        :mensaje-error="solicitud.mensajeError"
        :fecha-procesamiento="solicitud.fechaProcesamiento"
      />
    </template>

    <!-- Modal Inspector de Caché Redis & Mongo (HU-08) -->
    <CacheModal
      v-model:visible="modalCacheVisible"
      :cache="cacheHeader"
      tipo="Detalle de Solicitud"
      :cacheKey="`solicitud:${route.params.id}`"
      :onEjecutarPrueba="() => cargarDetalle(false)"
    />
  </div>
</template>

<style scoped>
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 2px;
}
.breadcrumb a {
  color: #2563eb;
  text-decoration: none;
}

.page-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
}

.id-mono {
  color: #2563eb;
  font-family: monospace;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-cache {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cache:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-back {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  text-decoration: none;
}

.cache-callout {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid;
  font-size: 0.85rem;
}
.cache-callout.hit {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}
.cache-callout.miss {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #334155;
}

.callout-ico {
  font-size: 1.3rem;
  line-height: 1.2;
}

.data-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.item-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.item-id {
  font-size: 0.76rem;
  color: #64748b;
  margin-top: 2px;
  display: block;
}
.item-id code {
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 4px;
  border-radius: 4px;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
}

.field-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lbl {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.val {
  font-size: 0.92rem;
  color: #0f172a;
}
.val.bold { font-weight: 600; color: #2563eb; }

.desc-box {
  padding-top: 16px;
}

.desc-text {
  margin-top: 6px;
  font-size: 0.92rem;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
}

.loading-box {
  padding: 40px;
  text-align: center;
  color: #64748b;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 10px auto;
}

.spin-icon {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
