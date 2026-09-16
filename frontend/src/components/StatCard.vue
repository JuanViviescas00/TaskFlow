<script setup>
// Tarjeta de indicador (taller §10)
defineProps({
  etiqueta: { type: String, required: true },
  valor: { type: Number, default: 0 },
  color: { type: String, default: '' },
})
</script>

<template>
  <div class="statcard" :class="color">
    <span class="statcard-valor">{{ valor }}</span>
    <span class="statcard-etiqueta">{{ etiqueta }}</span>
  </div>
</template>
