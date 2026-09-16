<script setup>
// Dashboard (doc §15.1, HU-08, HU-16): Indicadores en tiempo real + solicitudes recientes
import { ref, onMounted, onUnmounted, computed } from 'vue'
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

// Suscripción a eventos Socket.IO en tiempo real (HU-16)
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
  temporizador = setInterval(recargar, 10000) // respaldo periódico
})

onUnmounted(() => {
  if (temporizador) clearInterval(temporizador)
})
</script>

<template>
  <div class="dashboard-page">
    <div class="page-top-bar">
      <div>
        <h1 class="page-heading">Panel de Control</h1>
        <p class="page-subheading">Métricas en tiempo real y flujo de procesamiento</p>
      </div>

      <div class="top-actions">
        <!-- Indicador de Caché de las estadísticas (HU-08) -->
        <CacheBadge :cache="store.statsCache" />

        <RouterLink to="/solicitudes/nueva" class="btn-primary-action">
          ➕ Nueva solicitud
        </RouterLink>
      </div>
    </div>

    <div v-if="error" class="alerta error mb-4">
      <span class="alerta-icono">⚠️</span>
      <span>{{ error }}</span>
    </div>

    <!-- Actividad activa del Worker -->
    <div v-if="store.hayActividad" class="worker-notice">
      <div class="notice-icon">⚡</div>
      <div class="notice-text">
        <strong>Procesamiento en segundo plano activo</strong>
        <p>Hay solicitudes en cola o siendo atendidas por el Worker Node.js. Las actualizaciones se reflejan en tiempo real.</p>
      </div>
    </div>

    <!-- Grid de métricas / StatCards -->
    <div class="stats-grid">
      <StatCard
        etiqueta="Total Solicitudes"
        :valor="store.stats.total"
        color="azul"
      />
      <StatCard
        etiqueta="Pendientes"
        :valor="store.stats.pendientes"
        color="amarillo"
      />
      <StatCard
        etiqueta="En Cola (Redis)"
        :valor="store.stats.enCola"
        color="azul"
      />
      <StatCard
        etiqueta="En Proceso"
        :valor="store.stats.procesando"
        color="morado"
      />
      <StatCard
        etiqueta="Respondidas"
        :valor="store.stats.respondidas"
        color="verde"
      />
      <StatCard
        etiqueta="Con Error"
        :valor="store.stats.errores"
        color="rojo"
      />
    </div>

    <!-- Sección de Solicitudes Recientes -->
    <div class="recent-section">
      <div class="section-header">
        <div>
          <h3>Solicitudes Recientes</h3>
          <p class="section-desc">Últimos requerimientos registrados en el sistema</p>
        </div>
        <RouterLink to="/solicitudes" class="link-all">
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
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  gap: 12px;
}

.btn-primary-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #2563eb;
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  transition: all 0.2s;
}
.btn-primary-action:hover {
  background: #1d4ed8;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}

.worker-notice {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.notice-icon {
  font-size: 1.5rem;
}

.notice-text strong {
  color: #1e40af;
  font-size: 0.9rem;
}

.notice-text p {
  color: #3b82f6;
  font-size: 0.82rem;
  margin-top: 2px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.recent-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.section-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.section-desc {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 2px;
}

.link-all {
  color: #2563eb;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
}
.link-all:hover {
  text-decoration: underline;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
