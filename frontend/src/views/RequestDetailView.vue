<script setup>
// Detalle de solicitud (doc §15.4): datos completos, trazabilidad de estados y respuesta
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { obtenerSolicitud } from '../services/requestService'
import { useSocket } from '../composables/useSocket'
import EstadoBadge from '../components/EstadoBadge.vue'
import { formatDate } from '../utils/format'

const route = useRoute()
const solicitud = ref(null)
const cache = ref('')
const cargando = ref(true)
const error = ref('')

async function cargar() {
  try {
    const { data, cache: cacheHeader } = await obtenerSolicitud(route.params.id)
    if (!solicitud.value || solicitud.value.estado === data.estado) {
      cache.value = cacheHeader
    }
    solicitud.value = data
    error.value = ''
  } catch (e) {
    error.value = e.response?.status === 404
      ? 'La solicitud especificada no existe o fue eliminada.'
      : 'Error al consultar el detalle de la solicitud.'
  } finally {
    cargando.value = false
  }
}

const eventos = {
  'solicitud-procesando': (s) => { if (s.id === solicitud.value?.id) solicitud.value = s },
  'solicitud-respondida': (s) => { if (s.id === solicitud.value?.id) { solicitud.value = s; cache.value = '' } },
  'solicitud-error': (s) => { if (s.id === solicitud.value?.id) solicitud.value = s },
}
useSocket(eventos)

onMounted(cargar)

const pasosCiclo = ['PENDIENTE', 'EN_COLA', 'PROCESANDO', 'RESPONDIDA']

function indicePaso(estado) {
  if (estado === 'ERROR') return -1
  return pasosCiclo.indexOf(estado)
}
</script>

<template>
  <section class="vista estrecha">
    <header class="vista-header">
      <div>
        <div class="breadcrumb-nav">
          <RouterLink to="/solicitudes" class="breadcrumb-link">Solicitudes</RouterLink>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">Detalle</span>
        </div>
        <h2>Detalle de solicitud</h2>
        <p class="mono" v-if="solicitud">ID: {{ solicitud.id }}</p>
      </div>
      <RouterLink class="btn" to="/solicitudes">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Volver al listado
      </RouterLink>
    </header>

    <div v-if="cargando" class="cargando">
      <span class="spinner"></span>
      Cargando detalle de la solicitud...
    </div>
    <div v-else-if="error" class="alerta error" role="alert">
      <span>{{ error }}</span>
    </div>

    <template v-else-if="solicitud">
      <!-- Barra de progreso del ciclo de vida en espacio XY -->
      <div v-if="solicitud.estado !== 'ERROR'" class="timeline-ciclo" aria-label="Progreso del ciclo de vida">
        <div 
          v-for="(paso, idx) in pasosCiclo" 
          :key="paso"
          class="timeline-paso"
          :class="{
            'completado': indicePaso(solicitud.estado) > idx,
            'actual': indicePaso(solicitud.estado) === idx
          }"
        >
          <div class="paso-circulo">
            <svg v-if="indicePaso(solicitud.estado) > idx" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <span class="paso-nombre">{{ paso.replace('_', ' ') }}</span>
        </div>
      </div>

      <!-- Ficha técnica estructurada -->
      <div class="panel">
        <div class="panel-header">
          <h3>Información general</h3>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span v-if="cache" class="cache-badge" :class="cache.toLowerCase()">
              {{ cache }}
            </span>
            <EstadoBadge :estado="solicitud.estado" />
          </div>
        </div>

        <div class="datos-grid">
          <div class="fila-datos">
            <span class="etiqueta">Título</span>
            <span class="celda-destacada">{{ solicitud.titulo }}</span>
          </div>

          <div class="fila-datos">
            <span class="etiqueta">Categoría</span>
            <span>{{ solicitud.categoria }}</span>
          </div>

          <div class="fila-datos">
            <span class="etiqueta">Prioridad</span>
            <div>
              <span class="prioridad-pill" :class="solicitud.prioridad.toLowerCase()">{{ solicitud.prioridad }}</span>
            </div>
          </div>

          <div class="fila-datos">
            <span class="etiqueta">Fecha registro</span>
            <span class="texto-secundario">{{ formatDate(solicitud.fechaCreacion) }}</span>
          </div>

          <div class="fila-datos">
            <span class="etiqueta">Descripción</span>
            <p class="descripcion">{{ solicitud.descripcion }}</p>
          </div>
        </div>
      </div>

      <!-- Respuesta generada por el Worker -->
      <div v-if="solicitud.respuesta" class="panel respuesta-panel">
        <div class="panel-header" style="background-color: var(--color-success-bg);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3 style="color: var(--color-success-text); margin: 0;">Respuesta oficial del sistema</h3>
          </div>
          <span v-if="solicitud.fechaProcesamiento" class="texto-secundario" style="font-size: 0.8rem;">
            Procesado el {{ formatDate(solicitud.fechaProcesamiento) }}
          </span>
        </div>
        <div style="padding: 16px 20px;">
          <p class="descripcion" style="color: #0f172a; font-size: 0.94rem;">{{ solicitud.respuesta }}</p>
        </div>
      </div>

      <!-- Diagnóstico de error si aplica -->
      <div v-if="solicitud.mensajeError" class="panel error-panel-box">
        <div class="panel-header" style="background-color: var(--color-danger-bg);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 style="color: var(--color-danger-text); margin: 0;">Diagnóstico del error</h3>
          </div>
        </div>
        <div style="padding: 16px 20px;">
          <p style="color: var(--color-danger-text); font-size: 0.9rem;">{{ solicitud.mensajeError }}</p>
        </div>
      </div>
    </template>
  </section>
</template>
