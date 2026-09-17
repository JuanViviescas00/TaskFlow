<script setup>
// Monitor del sistema rediseñado con la superficie limpia y banner superior
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
  <div class="page-container">
    <div class="inner-banner-bar">
      <span>MONITOR DE INFRAESTRUCTURA, WORKER & EVENTOS SOCKET.IO</span>
    </div>

    <div class="main-surface-card">
      <div class="surface-header">
        <div class="title-group">
          <h2 class="main-page-title">Monitor del Sistema</h2>
          <p class="main-page-sub">Supervisión en tiempo real de los contenedores Docker Compose y la cola Redis</p>
        </div>

        <div class="surface-badges">
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

      <div v-if="monitor" class="services-wrapper">
        <!-- Servicios en Grid -->
        <div class="services-block">
          <h3 class="block-title">ESTADO DE SERVICIOS</h3>
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
              descripcion="Persistencia de solicitudes"
              icono="🍃"
              :disponible="monitor.servicios?.mongodb?.disponible"
              :detalles="{ Colección: 'solicitudes', Puerto: '27018' }"
            />

            <ServiceCard
              nombre="Redis Server"
              descripcion="Caché & Cola de solicitudes"
              icono="⚡"
              :disponible="monitor.servicios?.redis?.disponible"
              :detalles="{ Cola: 'cola:solicitudes', Puerto: '6380' }"
            />

            <ServiceCard
              nombre="Worker Node.js"
              descripcion="Procesamiento asíncrono"
              icono="👷"
              :disponible="monitor.servicios?.worker?.disponible"
              :detalles="{ Intervalo: '500ms', Modo: 'Asíncrono' }"
            />
          </div>
        </div>

        <!-- Métricas de Cola -->
        <QueueStats
          :cola="monitor.cola || 0"
          :pendientes="monitor.pendientes || 0"
          :procesando="monitor.procesando || 0"
          :respondidas="monitor.respondidas || 0"
          :errores="monitor.errores || 0"
          :eventos-recibidos="totalEventos"
        />

        <!-- Log en vivo de eventos -->
        <div class="events-card">
          <div class="events-header">
            <div class="events-title-box">
              <span class="pulse-ring"></span>
              <h4>Registro de Eventos en Vivo (Socket.IO)</h4>
            </div>
            <span class="events-counter">{{ eventLog.length }} eventos capturados</span>
          </div>

          <div v-if="eventLog.length === 0" class="empty-events">
            <p>Esperando actividad... Registra una solicitud para ver los eventos fluir en tiempo real.</p>
          </div>

          <div v-else class="events-scroll">
            <div
              v-for="ev in eventLog"
              :key="ev.id"
              class="event-row"
              :class="'ev-' + ev.tipo"
            >
              <span class="ev-time">{{ ev.tiempo }}</span>
              <span class="ev-tag">{{ ev.tipo }}</span>
              <span class="ev-info">{{ ev.data }}</span>
            </div>
          </div>
        </div>
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
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 16px;
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

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0d3830;
  border: none;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-refresh:hover:not(:disabled) {
  background: #14532d;
}

.services-wrapper {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.block-title {
  font-size: 0.78rem;
  font-weight: 800;
  color: #0d3830;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 14px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.events-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.events-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.events-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pulse-ring {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.events-title-box h4 {
  font-size: 1rem;
  font-weight: 800;
  color: #0d3830;
}

.events-counter {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 600;
}

.empty-events {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.86rem;
}

.events-scroll {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.82rem;
}

.event-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 12px;
  border-radius: 6px;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
}

.ev-time {
  color: #94a3b8;
  font-size: 0.74rem;
  white-space: nowrap;
}

.ev-tag {
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.ev-info {
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ev-solicitud-creada .ev-tag { background: #dbeafe; color: #1e40af; }
.ev-solicitud-encolada .ev-tag { background: #e0f2fe; color: #0369a1; }
.ev-solicitud-procesando .ev-tag { background: #ede9fe; color: #5b21b6; }
.ev-solicitud-respondida .ev-tag { background: #dcfce7; color: #166534; }
.ev-solicitud-error .ev-tag { background: #fee2e2; color: #991b1b; }

.spin-icon {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
