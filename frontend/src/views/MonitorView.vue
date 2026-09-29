<script setup>
// Monitor del sistema (doc §15.5): supervisión en tiempo real de servicios, colas y eventos
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
    error.value = 'No se pudo conectar con el backend (puerto 3001).'
  }
}

let temporizador = null
onMounted(() => {
  cargar()
  temporizador = setInterval(cargar, 5000)
})
onUnmounted(() => clearInterval(temporizador))
</script>

<template>
  <section class="vista">
    <header class="vista-header">
      <div>
        <h2>Monitor del Sistema</h2>
        <p>Estado de salud de la infraestructura, microservicios y cola asíncrona</p>
      </div>
      <div class="monitor-live-pill">
        <span class="badge-dot pulse" style="background-color: var(--color-success);"></span>
        <span>Sondeo cada 5s</span>
      </div>
    </header>

    <div v-if="error" class="alerta error" role="alert">
      <span>{{ error }}</span>
    </div>

    <div v-if="monitor" class="columnas">
      <!-- Panel de Servicios -->
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Infraestructura & Servicios</h3>
            <span class="subtexto-header">Disponibilidad de componentes en red</span>
          </div>
        </div>
        <ul class="lista-servicios">
          <li>
            <div class="servicio-info">
              <span class="servicio-nombre">Backend API (Express)</span>
              <span class="servicio-detalle">Puerto 3001 • Servidor HTTP y Socket.IO</span>
            </div>
            <span class="servicio-status disponible">
              <span class="punto verde"></span>
              Disponible
            </span>
          </li>

          <li>
            <div class="servicio-info">
              <span class="servicio-nombre">MongoDB Atlas</span>
              <span class="servicio-detalle">Cluster Cloud • Base de datos persistente</span>
            </div>
            <span 
              class="servicio-status" 
              :class="monitor.servicios.mongodb.disponible ? 'disponible' : 'no-disponible'"
            >
              <span class="punto" :class="monitor.servicios.mongodb.disponible ? 'verde' : 'rojo'"></span>
              {{ monitor.servicios.mongodb.disponible ? 'Disponible' : 'Inactivo' }}
            </span>
          </li>

          <li>
            <div class="servicio-info">
              <span class="servicio-nombre">Redis Server</span>
              <span class="servicio-detalle">Puerto 6379 • Caché distribuida y cola</span>
            </div>
            <span 
              class="servicio-status" 
              :class="monitor.servicios.redis.disponible ? 'disponible' : 'no-disponible'"
            >
              <span class="punto" :class="monitor.servicios.redis.disponible ? 'verde' : 'rojo'"></span>
              {{ monitor.servicios.redis.disponible ? 'Disponible' : 'Inactivo' }}
            </span>
          </li>

          <li>
            <div class="servicio-info">
              <span class="servicio-nombre">Worker de Procesamiento</span>
              <span class="servicio-detalle">Microservicio autónomo • Consumidor BRPOP</span>
            </div>
            <span 
              class="servicio-status" 
              :class="monitor.servicios.worker.disponible ? 'disponible' : 'no-disponible'"
            >
              <span class="punto" :class="monitor.servicios.worker.disponible ? 'verde' : 'rojo'"></span>
              {{ monitor.servicios.worker.disponible ? 'Disponible' : 'No disponible' }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Panel de Métricas de Procesamiento -->
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Métricas de Procesamiento</h3>
            <span class="subtexto-header">Volumen en tiempo real en MongoDB y Redis</span>
          </div>
        </div>
        <ul class="lista-metricas">
          <li>
            <span>Solicitudes en cola Redis (brpop)</span>
            <strong class="metrica-valor">{{ monitor.cola }}</strong>
          </li>
          <li>
            <span>Solicitudes en estado Pendiente</span>
            <strong class="metrica-valor">{{ monitor.pendientes }}</strong>
          </li>
          <li>
            <span>Solicitudes actualmente Procesando</span>
            <strong class="metrica-valor">{{ monitor.procesando }}</strong>
          </li>
          <li>
            <span>Solicitudes Respondidas</span>
            <strong class="metrica-valor">{{ monitor.respondidas }}</strong>
          </li>
          <li>
            <span>Solicitudes con Error</span>
            <strong class="metrica-valor" :style="monitor.errores > 0 ? 'color: var(--color-danger);' : ''">
              {{ monitor.errores }}
            </strong>
          </li>
          <li>
            <span>Eventos Socket.IO recibidos en vivo</span>
            <strong class="metrica-valor" style="color: var(--color-primary);">{{ eventosSocket }}</strong>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
