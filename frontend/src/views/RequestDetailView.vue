<script setup>
// Detalle de solicitud (doc §15.4, HU-03, HU-08, HU-16)
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRequestStore } from '../store/requestStore'
import { useSocket } from '../composables/useSocket'
import { useToast } from '../composables/useToast'
import EstadoBadge from '../components/EstadoBadge.vue'
import CacheBadge from '../components/common/CacheBadge.vue'
import ResponsePanel from '../components/requests/ResponsePanel.vue'
import { formatDate } from '../utils/format'

const route = useRoute()
const router = useRouter()
const store = useRequestStore()
const toast = useToast()

const solicitud = ref(null)
const cacheHeader = ref('MISS')
const cargando = ref(true)
const error = ref('')

async function cargarDetalle() {
  cargando.value = true
  try {
    const data = await store.cargarDetalle(route.params.id)
    solicitud.value = data
    cacheHeader.value = store.detailCache
    error.value = ''
  } catch (e) {
    error.value = store.error || 'No se pudo cargar la solicitud.'
  } finally {
    cargando.value = false
  }
}

// Eventos en tiempo real para reflejar cambios del Worker (HU-16)
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
  <div class="detail-page">
    <div class="page-top-bar">
      <div>
        <div class="breadcrumb">
          <RouterLink to="/solicitudes">Solicitudes</RouterLink>
          <span class="separator">/</span>
          <span>Detalle</span>
        </div>
        <h1 class="page-heading">
          Solicitud <span class="id-code">#{{ route.params.id ? route.params.id.slice(-6) : '' }}</span>
        </h1>
      </div>

      <div class="top-actions">
        <!-- Indicador de Caché prominente para la evaluación del SENA (HU-08) -->
        <CacheBadge :cache="cacheHeader" />

        <button
          type="button"
          class="btn-refresh"
          title="Consultar nuevamente para probar CACHE HIT / CACHE MISS"
          :disabled="cargando"
          @click="cargarDetalle"
        >
          <span :class="{ 'spin-icon': cargando }">🔄</span>
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
      <div class="cache-explanation-card" :class="cacheHeader === 'HIT' ? 'hit' : 'miss'">
        <span class="badge-icon">{{ cacheHeader === 'HIT' ? '⚡' : '💾' }}</span>
        <div class="cache-info-text">
          <strong>Resultado de la consulta: {{ cacheHeader === 'HIT' ? 'CACHE HIT' : 'CACHE MISS' }}</strong>
          <p v-if="cacheHeader === 'HIT'">
            La información se recuperó velozmente desde <strong>Redis</strong> sin necesidad de realizar una consulta a MongoDB.
          </p>
          <p v-else>
            La información no estaba en la caché temporal de Redis; fue leída de la base de datos persistente <strong>MongoDB</strong> y ahora ha quedado guardada en Redis para consultas posteriores.
          </p>
        </div>
      </div>

      <!-- Ficha de Datos de la Solicitud -->
      <div class="detail-card">
        <div class="card-section header-section">
          <div class="title-meta">
            <h2>{{ solicitud.titulo }}</h2>
            <p class="full-id">ID completo: <code>{{ solicitud.id }}</code></p>
          </div>
          <div class="status-box">
            <EstadoBadge :estado="solicitud.estado" />
          </div>
        </div>

        <div class="card-grid">
          <div class="data-item">
            <span class="data-label">Categoría</span>
            <span class="data-value cat-value">{{ solicitud.categoria }}</span>
          </div>

          <div class="data-item">
            <span class="data-label">Prioridad</span>
            <span
              class="data-value prio-value"
              :class="'prio-' + (solicitud.prioridad ? solicitud.prioridad.toLowerCase() : 'media')"
            >
              {{ solicitud.prioridad }}
            </span>
          </div>

          <div class="data-item">
            <span class="data-label">Fecha de Creación</span>
            <span class="data-value">{{ formatDate(solicitud.fechaCreacion) }}</span>
          </div>

          <div class="data-item">
            <span class="data-label">Fecha de Procesamiento</span>
            <span class="data-value">
              {{ solicitud.fechaProcesamiento ? formatDate(solicitud.fechaProcesamiento) : 'Pendiente' }}
            </span>
          </div>
        </div>

        <div class="desc-section">
          <span class="data-label">Descripción del Requerimiento</span>
          <p class="desc-content">{{ solicitud.descripcion }}</p>
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
  </div>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 960px;
  margin: 0 auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
  color: #64748b;
  margin-bottom: 4px;
}
.breadcrumb a {
  color: #2563eb;
  text-decoration: none;
}
.breadcrumb a:hover {
  text-decoration: underline;
}
.separator {
  color: #cbd5e1;
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

.id-code {
  color: #2563eb;
  font-family: monospace;
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
  border: 1px solid #cbd5e1;
  color: #334155;
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

.btn-back {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 500;
  text-decoration: none;
}

.cache-explanation-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 10px;
  border: 1px solid;
  font-size: 0.86rem;
}

.cache-explanation-card.hit {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.cache-explanation-card.miss {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #334155;
}

.badge-icon {
  font-size: 1.4rem;
  line-height: 1.2;
}

.cache-info-text strong {
  display: block;
  font-size: 0.92rem;
  margin-bottom: 2px;
}

.cache-info-text p {
  font-size: 0.82rem;
  opacity: 0.9;
  line-height: 1.4;
}

.detail-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid #f1f5f9;
}

.title-meta h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.full-id {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 4px;
}

.full-id code {
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
  padding: 20px 0;
  border-bottom: 1px solid #f1f5f9;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-value {
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 500;
}

.cat-value {
  color: #2563eb;
  font-weight: 600;
}

.prio-value {
  display: inline-block;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}
.prio-alta { background: #fef2f2; color: #b91c1c; }
.prio-media { background: #fffbeb; color: #b45309; }
.prio-baja { background: #f0fdf4; color: #15803d; }

.desc-section {
  padding-top: 20px;
}

.desc-content {
  margin-top: 8px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
}

.loading-box {
  padding: 60px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #64748b;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
