<script setup>
// Dashboard rediseñado con la estética moderna de tarjetas y superficies limpias
import { ref, onMounted, onUnmounted } from 'vue'
import { useRequestStore } from '../store/requestStore'
import { useSocket } from '../composables/useSocket'
import { useToast } from '../composables/useToast'
import StatCard from '../components/StatCard.vue'
import RequestTable from '../components/requests/RequestTable.vue'
import CacheBadge from '../components/common/CacheBadge.vue'

const store = useRequestStore()
const toast = useToast()

const cargando = ref(true)
const error = ref('')

const eventos = {
  'solicitud-creada': (s) => {
    recargar()
    toast.info(`Nueva solicitud registrada: "${s.titulo}"`, 'Dashboard')
  },
  'solicitud-encolada': () => recargar(),
  'solicitud-procesando': () => recargar(),
  'solicitud-respondida': (s) => {
    recargar()
    toast.success(`Solicitud #${s.id ? s.id.slice(-6) : ''} respondida`, 'Dashboard')
  },
  'solicitud-error': () => recargar(),
}
useSocket(eventos)

async function recargar() {
  try {
    await Promise.all([
      store.cargarEstadisticas(),
      store.cargarSolicitudes({ limite: 5 }),
    ])
    error.value = ''
  } catch (e) {
    error.value = 'No se pudo conectar con el backend (puerto 3001).'
  } finally {
    cargando.value = false
  }
}

let temporizador = null
onMounted(() => {
  recargar()
  temporizador = setInterval(recargar, 10000)
})

onUnmounted(() => {
  if (temporizador) clearInterval(temporizador)
})
</script>

<template>
  <div class="page-container">
    <!-- Barra decorativa superior interna estilo tarjeta de referencia -->
    <div class="inner-banner-bar">
      <span>RESUMEN GENERAL DEL SISTEMA & FLUJO ASÍNCRONO</span>
    </div>

    <!-- Superficie principal -->
    <div class="main-surface-card">
      <div class="surface-header">
        <div class="title-group">
          <h2 class="main-page-title">Panel de Control</h2>
          <p class="main-page-sub">Métricas en tiempo real, estado de la cola Redis y flujo de procesamiento</p>
        </div>

        <div class="surface-badges">
          <span class="count-pill">{{ store.stats.total }} SOLICITUDES</span>
          <CacheBadge :cache="store.statsCache" />
          <RouterLink to="/solicitudes/nueva" class="btn-primary-action">
            ➕ Nueva Solicitud
          </RouterLink>
        </div>
      </div>

      <div v-if="error" class="alerta error mb-4">
        <span class="alerta-icono">⚠️</span>
        <span>{{ error }}</span>
      </div>

      <!-- Aviso de actividad del worker -->
      <div v-if="store.hayActividad" class="worker-notice">
        <div class="notice-icon">⚡</div>
        <div class="notice-text">
          <strong>Worker Node.js procesando activamente</strong>
          <p>Hay solicitudes en cola o en ejecución. Las métricas se actualizan en vivo sin recargar.</p>
        </div>
      </div>

      <!-- Grid de indicadores (StatCards rediseñadas) -->
      <div class="stats-grid">
        <div class="stat-box total-box">
          <span class="stat-num">{{ store.stats.total }}</span>
          <span class="stat-name">Total Solicitudes</span>
          <span class="stat-sub">Registradas en MongoDB</span>
        </div>

        <div class="stat-box cola-box">
          <span class="stat-num">{{ store.stats.enCola }}</span>
          <span class="stat-name">En Cola (Redis)</span>
          <span class="stat-sub">Esperando Worker</span>
        </div>

        <div class="stat-box proc-box">
          <span class="stat-num">{{ store.stats.procesando }}</span>
          <span class="stat-name">Procesando</span>
          <span class="stat-sub">Worker evaluando reglas</span>
        </div>

        <div class="stat-box resp-box">
          <span class="stat-num">{{ store.stats.respondidas }}</span>
          <span class="stat-name">Respondidas</span>
          <span class="stat-sub">Procesadas con éxito</span>
        </div>

        <div class="stat-box err-box">
          <span class="stat-num">{{ store.stats.errores }}</span>
          <span class="stat-name">Con Error</span>
          <span class="stat-sub">Fallas controladas</span>
        </div>
      </div>

      <!-- Sección de Solicitudes Recientes -->
      <div class="recent-section">
        <div class="recent-header">
          <div>
            <h3 class="recent-title">Solicitudes Recientes</h3>
            <p class="recent-sub">Últimos trámites ingresados al sistema</p>
          </div>
          <RouterLink to="/solicitudes" class="link-view-all">
            Ver todas las solicitudes →
          </RouterLink>
        </div>

        <RequestTable
          :solicitudes="store.solicitudes.slice(0, 5)"
          :loading="cargando"
          @eliminar="(s) => store.remover(s.id)"
        />
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
  gap: 22px;
}

.surface-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.main-page-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: #0d3830;
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
  gap: 12px;
  flex-wrap: wrap;
}

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

.btn-primary-action {
  background: #0d3830;
  color: #ffffff;
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.15s;
  box-shadow: 0 2px 6px rgba(13, 56, 48, 0.2);
}
.btn-primary-action:hover {
  background: #14532d;
}

.worker-notice {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.notice-icon {
  font-size: 1.5rem;
  color: #059669;
}

.notice-text strong {
  color: #065f46;
  font-size: 0.92rem;
}

.notice-text p {
  color: #047857;
  font-size: 0.82rem;
  margin-top: 2px;
}

/* Grid de métricas con tarjetas redondeadas modernas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-box {
  background: #ffffff;
  border-radius: 14px;
  padding: 20px 18px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.stat-num {
  font-size: 2.1rem;
  font-weight: 900;
  line-height: 1;
}

.stat-name {
  font-size: 0.84rem;
  font-weight: 700;
  margin-top: 4px;
}

.stat-sub {
  font-size: 0.72rem;
  color: #64748b;
}

.total-box .stat-num { color: #0d3830; }
.total-box .stat-name { color: #0d3830; }

.cola-box .stat-num { color: #0284c7; }
.cola-box .stat-name { color: #0369a1; }

.proc-box .stat-num { color: #7c3aed; }
.proc-box .stat-name { color: #6d28d9; }

.resp-box .stat-num { color: #16a34a; }
.resp-box .stat-name { color: #15803d; }

.err-box .stat-num { color: #dc2626; }
.err-box .stat-name { color: #b91c1c; }

/* Sección reciente */
.recent-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 8px;
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.recent-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0d3830;
}

.recent-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 2px;
}

.link-view-all {
  color: #0d3830;
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
}
.link-view-all:hover {
  text-decoration: underline;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
