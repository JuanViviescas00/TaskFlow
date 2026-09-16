<script setup>
// Monitor del sistema y flujo asíncrono (doc §15.5, HU-09, HU-16)
import { ref, onMounted, onUnmounted } from 'vue'
import { obtenerMonitor } from '../services/requestService'
import { useSocket } from '../composables/useSocket'
import ServiceCard from '../components/monitor/ServiceCard.vue'
import QueueStats from '../components/monitor/QueueStats.vue'

const monitor = ref(null)
const error = ref('')
const cargando = ref(true)
const eventLog = ref([])
const totalEventos = ref(0)

function registrarEvento(tipo, data) {
  totalEventos.value++
  const item = {
    id: Date.now() + Math.random(),
    tiempo: new Date().toLocaleTimeString(),
    tipo,
    data: typeof data === 'object' ? JSON.stringify(data) : data,
  }
  eventLog.value.unshift(item)
  if (eventLog.value.length > 25) {
    eventLog.value.pop()
  }
  cargar()
}

const eventos = {
  'cola-actualizada': (d) => registrarEvento('cola-actualizada', d),
  'monitor-actualizado': (d) => registrarEvento('monitor-actualizado', d),
  'solicitud-creada': (s) => registrarEvento('solicitud-creada', `#${s?.id ? s.id.slice(-6) : ''} - ${s?.titulo}`),
  'solicitud-encolada': (s) => registrarEvento('solicitud-encolada', `#${s?.id ? s.id.slice(-6) : ''}`),
  'solicitud-procesando': (s) => registrarEvento('solicitud-procesando', `#${s?.id ? s.id.slice(-6) : ''}`),
  'solicitud-respondida': (s) => registrarEvento('solicitud-respondida', `#${s?.id ? s.id.slice(-6) : ''}`),
  'solicitud-error': (s) => registrarEvento('solicitud-error', `#${s?.id ? s.id.slice(-6) : ''}`),
}
useSocket(eventos)

async function cargar() {
  try {
    monitor.value = await obtenerMonitor()
    error.value = ''
  } catch (e) {
    error.value = 'No se pudo conectar con el backend (puerto 3001).'
  } finally {
    cargando.value = false
  }
}

let temporizador = null
onMounted(() => {
  cargar()
  temporizador = setInterval(cargar, 4000)
})

onUnmounted(() => {
  if (temporizador) clearInterval(temporizador)
})
</script>

<template>
  <div class="monitor-page">
    <div class="page-top-bar">
      <div>
        <h1 class="page-heading">Monitor de Servicios & Worker</h1>
        <p class="page-subheading">
          Supervisión en tiempo real de los servicios Docker Compose y la cola Redis
        </p>
      </div>

      <div class="top-actions">
        <button
          type="button"
          class="btn-refresh"
          :disabled="cargando"
          @click="cargar"
        >
          <span :class="{ 'spin-icon': cargando }">🔄</span>
          <span>Actualizar</span>
        </button>
      </div>
    </div>

    <div v-if="error" class="alerta error">
      <span class="alerta-icono">⚠️</span>
      <span>{{ error }}</span>
    </div>

    <!-- Sección de Servicios -->
    <div v-if="monitor" class="services-section">
      <h3 class="section-title">Infraestructura y Contenedores</h3>
      <div class="services-grid">
        <ServiceCard
          nombre="Express API"
          descripcion="Backend REST + Socket.IO"
          icono="🚀"
          :disponible="monitor.servicios?.express?.disponible"
          :detalles="{ Puerto: '3000 (3001 host)', Protocolo: 'HTTP / REST' }"
        />

        <ServiceCard
          nombre="MongoDB"
          descripcion="Base de datos persistente"
          icono="🍃"
          :disponible="monitor.servicios?.mongodb?.disponible"
          :detalles="{ Colección: 'solicitudes', Puerto: '27017' }"
        />

        <ServiceCard
          nombre="Redis Server"
          descripcion="Caché & Cola de solicitudes"
          icono="⚡"
          :disponible="monitor.servicios?.redis?.disponible"
          :detalles="{ Cola: 'cola:solicitudes', Puerto: '6379' }"
        />

        <ServiceCard
          nombre="Worker Node.js"
          descripcion="Procesamiento asíncrono"
          icono="👷"
          :disponible="monitor.servicios?.worker?.disponible"
          :detalles="{ Intervalo: '500ms', Modo: 'Asíncrono' }"
        />
      </div>

      <!-- Métricas de la Cola -->
      <QueueStats
        :cola="monitor.cola || 0"
        :pendientes="monitor.pendientes || 0"
        :procesando="monitor.procesando || 0"
        :respondidas="monitor.respondidas || 0"
        :errores="monitor.errores || 0"
        :eventos-recibidos="totalEventos"
      />

      <!-- Registro en vivo de eventos Socket.IO (didáctico para sustentación SENA) -->
      <div class="events-log-card">
        <div class="log-header">
          <div class="log-title">
            <span class="pulse-ring"></span>
            <h4>Registro de Eventos en Tiempo Real (Socket.IO)</h4>
          </div>
          <span class="log-count">{{ eventLog.length }} eventos capturados</span>
        </div>

        <div v-if="eventLog.length === 0" class="empty-log">
          <p>Esperando eventos del sistema... Registra una solicitud para ver la actividad en vivo.</p>
        </div>

        <div v-else class="log-list">
          <div
            v-for="ev in eventLog"
            :key="ev.id"
            class="log-item"
            :class="'ev-' + ev.tipo"
          >
            <span class="log-time">{{ ev.tiempo }}</span>
            <span class="log-type">{{ ev.tipo }}</span>
            <span class="log-data">{{ ev.data }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitor-page {
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

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 14px;
}

.services-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.events-log-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pulse-ring {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.log-title h4 {
  font-size: 0.98rem;
  font-weight: 700;
  color: #0f172a;
}

.log-count {
  font-size: 0.78rem;
  color: #64748b;
}

.empty-log {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.88rem;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.82rem;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
}

.log-time {
  color: #94a3b8;
  font-size: 0.75rem;
  white-space: nowrap;
}

.log-type {
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.log-data {
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ev-solicitud-creada .log-type { background: #eff6ff; color: #1d4ed8; }
.ev-solicitud-encolada .log-type { background: #eff6ff; color: #2563eb; }
.ev-solicitud-procesando .log-type { background: #faf5ff; color: #7e22ce; }
.ev-solicitud-respondida .log-type { background: #f0fdf4; color: #15803d; }
.ev-solicitud-error .log-type { background: #fef2f2; color: #b91c1c; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
