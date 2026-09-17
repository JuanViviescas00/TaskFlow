<script setup>
// Detalle de solicitud con banner superior y ficha estilo superficie clara
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRequestStore } from '../store/requestStore'
import { useSocket } from '../composables/useSocket'
import { useToast } from '../composables/useToast'
import EstadoBadge from '../components/EstadoBadge.vue'
import CacheBadge from '../components/common/CacheBadge.vue'
import ResponsePanel from '../components/requests/ResponsePanel.vue'
import { formatDate } from '../utils/format'

const route = useRoute()
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
  <div class="page-container">
    <div class="inner-banner-bar">
      <span>CONSULTA DE DETALLE & VALIDACIÓN DE CACHÉ</span>
    </div>

    <div class="main-surface-card">
      <div class="surface-header">
        <div class="title-group">
          <div class="breadcrumb">
            <RouterLink to="/solicitudes">Mis Solicitudes</RouterLink>
            <span class="separator">/</span>
            <span>Detalle</span>
          </div>
          <h2 class="main-page-title">
            Solicitud <span class="id-tag">#{{ route.params.id ? route.params.id.slice(-6) : '' }}</span>
          </h2>
        </div>

        <div class="surface-badges">
          <CacheBadge :cache="cacheHeader" />
          <button
            type="button"
            class="btn-cache-test"
            title="Consultar nuevamente para probar CACHE HIT / CACHE MISS"
            :disabled="cargando"
            @click="cargarDetalle"
          >
            <span :class="{ 'spin-icon': cargando }">🔄</span>
            <span>Probar Caché</span>
          </button>
          <RouterLink to="/solicitudes" class="btn-back-link">
            ← Volver
          </RouterLink>
        </div>
      </div>

      <div v-if="cargando" class="loading-box">
        <div class="spinner"></div>
        <p>Consultando información de la solicitud...</p>
      </div>

      <div v-else-if="error" class="alerta error">
        <span class="alerta-icono">⚠️</span>
        <span>{{ error }}</span>
      </div>

      <template v-else-if="solicitud">
        <!-- Explicación pedagógica de la Caché (HU-08) -->
        <div class="cache-info-box" :class="cacheHeader === 'HIT' ? 'hit' : 'miss'">
          <span class="cache-symbol">{{ cacheHeader === 'HIT' ? '⚡' : '💾' }}</span>
          <div>
            <strong>Resultado: {{ cacheHeader === 'HIT' ? 'CACHE HIT (Redis)' : 'CACHE MISS (MongoDB)' }}</strong>
            <p v-if="cacheHeader === 'HIT'">
              La información fue obtenida instantáneamente desde la memoria de <strong>Redis</strong> sin realizar consultas a la base de datos persistente.
            </p>
            <p v-else>
              La solicitud fue leída desde la base de datos persistente <strong>MongoDB</strong> y se ha almacenado temporalmente en <strong>Redis</strong> para acelerar futuras consultas.
            </p>
          </div>
        </div>

        <!-- Ficha de Datos de la Solicitud -->
        <div class="detail-card">
          <div class="card-top-row">
            <div>
              <h3 class="req-title">{{ solicitud.titulo }}</h3>
              <p class="req-full-id">Identificador único: <code>{{ solicitud.id }}</code></p>
            </div>
            <EstadoBadge :estado="solicitud.estado" />
          </div>

          <div class="card-fields-grid">
            <div class="field-item">
              <span class="field-label">Categoría</span>
              <span class="field-val cat-pill">{{ solicitud.categoria }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">Prioridad</span>
              <span class="field-val">{{ solicitud.prioridad }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">Fecha de Registro</span>
              <span class="field-val">{{ formatDate(solicitud.fechaCreacion) }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">Fecha de Procesamiento</span>
              <span class="field-val">{{ solicitud.fechaProcesamiento ? formatDate(solicitud.fechaProcesamiento) : 'En espera' }}</span>
            </div>
          </div>

          <div class="desc-box">
            <span class="field-label">Descripción</span>
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
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 1200px;
  margin: 0 auto;
}

.inner-banner-bar {
  background: #0d3830;
  color: #86efac;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 10px 24px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
}

.main-surface-card {
  background: #f4f7f6;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-top: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.surface-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 16px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 4px;
}
.breadcrumb a {
  color: #0d3830;
  font-weight: 600;
  text-decoration: none;
}
.separator { color: #cbd5e1; }

.main-page-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: #0d3830;
  letter-spacing: -0.5px;
}

.id-tag {
  color: #15803d;
  font-family: monospace;
}

.surface-badges {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-cache-test {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0d3830;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cache-test:hover:not(:disabled) {
  background: #14532d;
}

.btn-back-link {
  background: white;
  border: 1px solid #cbd5e1;
  color: #0d3830;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
}

.cache-info-box {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid;
  font-size: 0.86rem;
}
.cache-info-box.hit {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}
.cache-info-box.miss {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #334155;
}

.cache-symbol {
  font-size: 1.4rem;
  line-height: 1.2;
}

.detail-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.req-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0d3830;
}

.req-full-id {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 4px;
}
.req-full-id code {
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid #f1f5f9;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 0.74rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-val {
  font-size: 0.92rem;
  color: #0f172a;
  font-weight: 600;
}

.cat-pill {
  color: #0d3830;
}

.desc-box {
  padding-top: 18px;
}

.desc-text {
  margin-top: 6px;
  font-size: 0.94rem;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
}

.loading-box {
  padding: 48px;
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
  border-top-color: #0d3830;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spin-icon {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
