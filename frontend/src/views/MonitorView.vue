<script setup>
// Monitor (doc §15.5): estado de servicios y contadores (HU-09, HU-16).
import { ref, onMounted, onUnmounted } from 'vue'
import { obtenerMonitor } from '../services/requestService'
import { useSocket } from '../composables/useSocket'

const monitor = ref(null)
const error = ref('')
const eventosSocket = ref(0)

const eventos = {
  'cola-actualizada': () => cargar(),
  'monitor-actualizado': () => { eventosSocket.value++; cargar() },
  'solicitud-creada': () => { eventosSocket.value++; cargar() },
  'solicitud-encolada': () => { eventosSocket.value++; cargar() },
  'solicitud-procesando': () => { eventosSocket.value++; cargar() },
  'solicitud-respondida': () => { eventosSocket.value++; cargar() },
  'solicitud-error': () => { eventosSocket.value++; cargar() },
}
useSocket(eventos)

async function cargar() {
  try {
    monitor.value = await obtenerMonitor()
    error.value = ''
  } catch {
    error.value = 'No se pudo conectar con el backend (¿puerto 3001?).'
  }
}

let temporizador = null
onMounted(() => {
  cargar()
  temporizador = setInterval(cargar, 5000)
})
onUnmounted(() => clearInterval(temporizador))

function claseServicio(disponible) {
  if (disponible === true) return 'disponible'
  if (disponible === false) return 'no-disponible'
  return 'desconocido'
}

function textoServicio(disponible) {
  if (disponible === true) return '✓ Disponible'
  if (disponible === false) return '✗ No disponible'
  return '? Sin reporte'
}
</script>

<template>
  <section class="vista">
    <header class="vista-header">
      <div>
        <h2>Monitor TASKFLOW</h2>
        <p>Estado de los servicios y de la cola de procesamiento</p>
      </div>
    </header>

    <p v-if="error" class="alerta error">{{ error }}</p>

    <div v-if="monitor" class="columnas">
      <div class="panel">
        <h3>Servicios</h3>
        <ul class="lista-servicios">
          <li :class="claseServicio(true)">
            <span>Express (Backend API)</span><span>{{ textoServicio(true) }}</span>
          </li>
          <li :class="claseServicio(monitor.servicios.mongodb.disponible)">
            <span>MongoDB</span><span>{{ textoServicio(monitor.servicios.mongodb.disponible) }}</span>
          </li>
          <li :class="claseServicio(monitor.servicios.redis.disponible)">
            <span>Redis</span><span>{{ textoServicio(monitor.servicios.redis.disponible) }}</span>
          </li>
          <li :class="claseServicio(monitor.servicios.worker.disponible)">
            <span>Worker</span><span>{{ textoServicio(monitor.servicios.worker.disponible) }}</span>
          </li>
        </ul>
      </div>

      <div class="panel">
        <h3>Procesamiento</h3>
        <ul class="lista-servicios">
          <li><span>En cola</span><strong>{{ monitor.cola }}</strong></li>
          <li><span>Pendientes</span><strong>{{ monitor.pendientes }}</strong></li>
          <li><span>Procesando</span><strong>{{ monitor.procesando }}</strong></li>
          <li><span>Respondidas</span><strong>{{ monitor.respondidas }}</strong></li>
          <li><span>Errores</span><strong>{{ monitor.errores }}</strong></li>
          <li><span>Eventos Socket.IO recibidos</span><strong>{{ eventosSocket }}</strong></li>
        </ul>
      </div>
    </div>
  </section>
</template>
