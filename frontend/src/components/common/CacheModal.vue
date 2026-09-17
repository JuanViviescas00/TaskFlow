<script setup>
import { ref } from 'vue'
import CacheBadge from './CacheBadge.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  cache: {
    type: String,
    default: 'MISS',
  },
  tipo: {
    type: String,
    default: 'Detalle de Solicitud',
  },
  cacheKey: {
    type: String,
    default: 'solicitud:<ID>',
  },
  onEjecutarPrueba: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits(['update:visible', 'close', 'probado'])

const probando = ref(false)
const tiempoRespuesta = ref(null)
const logResultado = ref('')

async function ejecutarPrueba() {
  probando.value = true
  logResultado.value = ''
  const t0 = performance.now()
  try {
    let nuevoCache = props.cache
    if (props.onEjecutarPrueba) {
      const res = await props.onEjecutarPrueba()
      if (res && res.cache) nuevoCache = res.cache
    }
    const t1 = performance.now()
    tiempoRespuesta.value = Math.round(t1 - t0)
    
    if (nuevoCache === 'HIT' || props.cache === 'HIT') {
      logResultado.value = `⚡ ¡CACHE HIT confirmado! La respuesta fue servida directamente desde la memoria RAM de Redis en ${tiempoRespuesta.value} ms sin tocar la base de datos.`
    } else {
      logResultado.value = `💾 CACHE MISS registrado. Los datos se leyeron de MongoDB en ${tiempoRespuesta.value} ms y ahora quedaron almacenados en Redis para la próxima consulta.`
    }
    emit('probado', { cache: nuevoCache, tiempo: tiempoRespuesta.value })
  } catch (err) {
    logResultado.value = `❌ Error al consultar la caché: ${err.message || 'Error de red'}`
  } finally {
    probando.value = false
  }
}

function cerrar() {
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="modal-backdrop" @click.self="cerrar">
        <div class="modal-card" role="dialog" aria-modal="true">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="header-icon-title">
              <span class="pulse-icon">⚡</span>
              <div>
                <h3 class="modal-title">Inspector de Caché (Redis vs MongoDB)</h3>
                <span class="modal-subtitle">Demostración técnica de rendimiento y HU-08</span>
              </div>
            </div>
            <button class="btn-close" @click="cerrar" title="Cerrar ventana">✕</button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Estado Actual -->
            <div class="status-banner" :class="cache === 'HIT' ? 'hit-banner' : 'miss-banner'">
              <div class="banner-badge">
                <CacheBadge :cache="cache" :showLabel="true" />
              </div>
              <p class="banner-desc">
                <template v-if="cache === 'HIT'">
                  <strong>Atendido desde Redis (RAM):</strong> El backend encontró la información pre-cargada en memoria Redis, evitando consultar el motor de base de datos MongoDB.
                </template>
                <template v-else>
                  <strong>Atendido desde MongoDB (Disco):</strong> Primera consulta o caché expirada/invalidada. Se leyó directamente de la base de datos MongoDB y se guardó en Redis para las siguientes lecturas.
                </template>
              </p>
            </div>

            <!-- Panel de Métricas / Benchmark -->
            <div class="metric-grid">
              <div class="metric-item">
                <span class="m-label">Tipo de Consulta</span>
                <span class="m-val">{{ tipo }}</span>
              </div>
              <div class="metric-item">
                <span class="m-label">Clave en Redis</span>
                <span class="m-val mono">{{ cacheKey }}</span>
              </div>
              <div class="metric-item">
                <span class="m-label">Estrategia</span>
                <span class="m-val">Cache-Aside (Lazy Loading)</span>
              </div>
              <div class="metric-item">
                <span class="m-label">Tiempo de Respuesta</span>
                <span class="m-val" :class="tiempoRespuesta ? (tiempoRespuesta < 15 ? 'fast' : 'regular') : ''">
                  {{ tiempoRespuesta !== null ? `${tiempoRespuesta} ms` : (cache === 'HIT' ? '< 5 ms' : '~25-50 ms') }}
                </span>
              </div>
            </div>

            <!-- Comparativa Visual -->
            <div class="comparison-box">
              <div class="comp-item">
                <div class="comp-header">
                  <span>⚡ Redis (En memoria RAM)</span>
                  <span class="comp-speed">&lt; 5 ms</span>
                </div>
                <div class="bar-container">
                  <div class="bar-fill redis-bar" style="width: 15%"></div>
                </div>
              </div>
              <div class="comp-item">
                <div class="comp-header">
                  <span>💾 MongoDB (Base de datos persistente)</span>
                  <span class="comp-speed">~35 - 80 ms</span>
                </div>
                <div class="bar-container">
                  <div class="bar-fill mongo-bar" style="width: 85%"></div>
                </div>
              </div>
            </div>

            <!-- Resultado de la Prueba en Vivo -->
            <div v-if="logResultado" class="test-result-box" :class="cache === 'HIT' ? 'hit-box' : 'miss-box'">
              <p>{{ logResultado }}</p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button
              type="button"
              class="btn-test"
              :disabled="probando"
              @click="ejecutarPrueba"
            >
              <span :class="{ 'spin-icon': probando }">{{ probando ? '⏳' : '🔄' }}</span>
              <span>{{ probando ? 'Consultando...' : 'Ejecutar Prueba de Caché en Vivo' }}</span>
            </button>
            <button type="button" class="btn-cancel" @click="cerrar">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-card {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 20px 35px -8px rgba(15, 23, 42, 0.25), 0 0 1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e2e8f0;
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fafafa;
}

.header-icon-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pulse-icon {
  font-size: 1.6rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-subtitle {
  font-size: 0.8rem;
  color: #64748b;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.status-banner {
  padding: 1rem 1.25rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.status-banner.hit-banner {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.status-banner.miss-banner {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.banner-badge {
  display: flex;
  align-items: center;
}

.banner-desc {
  margin: 0;
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.45;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 600;
}

.m-val {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

.m-val.mono {
  font-family: monospace;
  font-size: 0.82rem;
  color: #4f46e5;
  word-break: break-all;
}

.m-val.fast {
  color: #059669;
}

.m-val.regular {
  color: #d97706;
}

.comparison-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #ffffff;
  padding: 0.75rem 1rem;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
}

.comp-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.comp-speed {
  font-family: monospace;
  font-size: 0.75rem;
  color: #059669;
}

.bar-container {
  background: #e2e8f0;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.redis-bar {
  background: linear-gradient(90deg, #10b981, #059669);
}

.mongo-bar {
  background: linear-gradient(90deg, #6366f1, #4f46e5);
}

.test-result-box {
  padding: 0.85rem 1.1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  line-height: 1.4;
  animation: fadeIn 0.25s ease;
}

.test-result-box p {
  margin: 0;
}

.test-result-box.hit-box {
  background: #dcfce7;
  color: #14532d;
  border: 1px solid #86efac;
}

.test-result-box.miss-box {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #cbd5e1;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #fafafa;
  border-top: 1px solid #f1f5f9;
}

.btn-test {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  color: #ffffff;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 9px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);
}

.btn-test:hover:not(:disabled) {
  opacity: 0.94;
  transform: translateY(-1px);
}

.btn-test:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.65rem 1rem;
  border-radius: 9px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover {
  background: #f8fafc;
  color: #0f172a;
}

.spin-icon {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
