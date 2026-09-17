<script setup>
// Monitor del sistema limpio y moderno
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
  <div class="monitor-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Monitor del Sistema</h2>
        <p class="page-sub">Supervisión en vivo de servicios Docker Compose, cola Redis y Worker</p>
      </div>

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

    <div v-if="error" class="alerta error">
      <span class="alerta-icono">⚠️</span>
      <span>{{ error }}</span>
    </div>

    <div v-if="monitor" class="monitor-body">
      <!-- Servicios -->
      <div class="section-box">
        <h3 class="section-heading">SERVICIOS & INFRAESTRUCTURA</h3>
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

      <!-- Log de eventos -->
      <div class="log-card">
        <div class="log-header">
          <div class="log-title">
            <span class="pulse-dot"></span>
            <h4>Registro de Eventos en Tiempo Real (Socket.IO)</h4>
          </div>
          <span class="log-badge">{{ eventLog.length }} eventos</span>
        </div>

        <div v-if="eventLog.length === 0" class="empty-log">
          <p>Esperando actividad... Registra una solicitud para ver los eventos en vivo.</p>
        </div>

        <div v-else class="log-stream">
          <div
            v-for="ev in eventLog"
            :key="ev.id"
            class="log-row"
            :class="'ev-' + ev.tipo"
          >
            <span class="ev-time">{{ ev.tiempo }}</span>
            <span class="ev-tag">{{ ev.tipo }}</span>
            <span class="ev-data">{{ ev.data }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitor-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.page-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
}

.page-sub {
  font-size: 0.84rem;
  color: #64748b;
  margin-top: 2px;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-refresh:hover:not(:disabled) {
  background: #f8fafc;
}

.monitor-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-heading {
  font-size: 0.74rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.8px;
  margin-bottom: 12px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.log-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}

.log-title h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.log-badge {
  font-size: 0.76rem;
  color: #64748b;
  font-weight: 600;
}

.empty-log {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.86rem;
}

.log-stream {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 250px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.82rem;
}

.log-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
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

.ev-data {
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ev-solicitud-creada .ev-tag { background: #dbeafe; color: #1e40af; }
.ev-solicitud-encolada .ev-tag { background: #e0f2fe; color: #0369a1; }
.ev-solicitud-procesando .ev-tag { background: #ede9fe; color: #5b21b6; }
.ev-solicitud-respondida .ev-tag { background: #dcfce7; color: #166534; }
.ev-solicitud-error .ev-tag { background: #fee2e2; color: #b91c1c; }

.spin-icon {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
