<script setup>
// Dashboard limpio y moderno de TASKFLOW
import { ref, onMounted, onUnmounted } from 'vue'
import { useRequestStore } from '../store/requestStore'
import { useSocket } from '../composables/useSocket'
import { useToast } from '../composables/useToast'
import RequestTable from '../components/requests/RequestTable.vue'
import CacheBadge from '../components/common/CacheBadge.vue'

const store = useRequestStore()
const toast = useToast()

const cargando = ref(true)
const error = ref('')

const eventos = {
  'solicitud-creada': (s) => {
    recargar()
    toast.info(`Nueva solicitud: "${s.titulo}"`, 'Dashboard')
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
  <div class="dashboard-container">
    <!-- Encabezado -->
    <div class="dash-header">
      <div>
        <h2 class="dash-title">Panel de Control</h2>
        <p class="dash-sub">Métricas en tiempo real y flujo de procesamiento</p>
      </div>

      <div class="dash-actions">
        <CacheBadge :cache="store.statsCache" />
        <RouterLink to="/solicitudes/nueva" class="btn-primary">
          ➕ Nueva Solicitud
        </RouterLink>
      </div>
    </div>

    <div v-if="error" class="alerta error mb-4">
      <span class="alerta-icono">⚠️</span>
      <span>{{ error }}</span>
    </div>

    <!-- Banner si hay actividad de procesamiento -->
    <div v-if="store.hayActividad" class="active-worker-card">
      <span class="worker-pulse">⚡</span>
      <div>
        <strong>Worker Node.js en ejecución</strong>
        <p>Procesando solicitudes asíncronamente desde la cola Redis. Los cambios se actualizan automáticamente.</p>
      </div>
    </div>

    <!-- Tarjetas métricas modernas -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-total">
        <div class="kpi-header">
          <span class="kpi-title">Total Solicitudes</span>
          <span class="kpi-ico">📁</span>
        </div>
        <span class="kpi-val">{{ store.stats.total }}</span>
        <span class="kpi-desc">Registradas en MongoDB</span>
      </div>

      <div class="kpi-card kpi-queue">
        <div class="kpi-header">
          <span class="kpi-title">En Cola (Redis)</span>
          <span class="kpi-ico">⏳</span>
        </div>
        <span class="kpi-val">{{ store.stats.enCola }}</span>
        <span class="kpi-desc">Esperando turno</span>
      </div>

      <div class="kpi-card kpi-process">
        <div class="kpi-header">
          <span class="kpi-title">En Proceso</span>
          <span class="kpi-ico">⚙️</span>
        </div>
        <span class="kpi-val">{{ store.stats.procesando }}</span>
        <span class="kpi-desc">Worker ejecutando</span>
      </div>

      <div class="kpi-card kpi-success">
        <div class="kpi-header">
          <span class="kpi-title">Respondidas</span>
          <span class="kpi-ico">✓</span>
        </div>
        <span class="kpi-val">{{ store.stats.respondidas }}</span>
        <span class="kpi-desc">Atendidas con éxito</span>
      </div>

      <div class="kpi-card kpi-error">
        <div class="kpi-header">
          <span class="kpi-title">Con Error</span>
          <span class="kpi-ico">⚠️</span>
        </div>
        <span class="kpi-val">{{ store.stats.errores }}</span>
        <span class="kpi-desc">Fallas controladas</span>
      </div>
    </div>

    <!-- Tabla de Solicitudes Recientes -->
    <div class="recent-card">
      <div class="recent-header">
        <div>
          <h3 class="recent-title">Solicitudes Recientes</h3>
          <p class="recent-sub">Últimos requerimientos registrados en el sistema</p>
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
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 1400px;
  margin: 0 auto;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.dash-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.dash-sub {
  font-size: 0.84rem;
  color: #64748b;
  margin-top: 2px;
}

.dash-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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

.active-worker-card {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.worker-pulse {
  font-size: 1.4rem;
  color: #2563eb;
}

.active-worker-card strong {
  color: #1e40af;
  font-size: 0.9rem;
}

.active-worker-card p {
  color: #3b82f6;
  font-size: 0.8rem;
  margin-top: 2px;
}

/* KPIs modernos */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.kpi-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.kpi-ico {
  font-size: 1.1rem;
}

.kpi-val {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
  margin-top: 4px;
}

.kpi-desc {
  font-size: 0.72rem;
  color: #94a3b8;
}

.kpi-total { border-top: 3px solid #2563eb; }
.kpi-queue { border-top: 3px solid #0284c7; }
.kpi-process { border-top: 3px solid #7c3aed; }
.kpi-success { border-top: 3px solid #16a34a; }
.kpi-error { border-top: 3px solid #dc2626; }

/* Sección reciente */
.recent-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.recent-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.recent-sub {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 2px;
}

.link-all {
  color: #2563eb;
  font-size: 0.84rem;
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
