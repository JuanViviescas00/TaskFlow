<script setup>
// Indicador de estado accesible con micropulso plano y contraste WCAG AA (doc §6)
defineProps({
  estado: { type: String, required: true },
})

const CLASES = {
  PENDIENTE: 'badge pendiente',
  EN_COLA: 'badge encola',
  PROCESANDO: 'badge procesando',
  RESPONDIDA: 'badge respondida',
  ERROR: 'badge error',
}

const ETIQUETAS = {
  PENDIENTE: 'Pendiente',
  EN_COLA: 'En cola',
  PROCESANDO: 'Procesando',
  RESPONDIDA: 'Respondida',
  ERROR: 'Error',
}
</script>

<template>
  <span 
    :class="CLASES[estado] || 'badge'" 
    role="status" 
    :aria-label="`Estado: ${ETIQUETAS[estado] || estado}`"
  >
    <span v-if="estado === 'PROCESANDO'" class="badge-dot pulse" aria-hidden="true"></span>
    <span v-else-if="estado === 'EN_COLA'" class="badge-dot delay-pulse" aria-hidden="true"></span>
    <span v-else class="badge-dot" aria-hidden="true"></span>
    <span class="badge-text">{{ ETIQUETAS[estado] || estado }}</span>
  </span>
</template>
