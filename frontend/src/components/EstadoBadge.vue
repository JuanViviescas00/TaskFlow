<script setup>
// Indicador de estado con color por estado (taller §6)
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
  PENDIENTE: 'PENDIENTE',
  EN_COLA: 'EN COLA',
  PROCESANDO: 'PROCESANDO',
  RESPONDIDA: 'RESPONDIDA',
  ERROR: 'ERROR',
}
</script>

<template>
  <span :class="CLASES[estado] || 'badge'">{{ ETIQUETAS[estado] || estado }}</span>
</template>
