<script setup>
// Indicador de estado moderno con punto de pulso y colores diferenciados (taller §6, HU-07)
defineProps({
  estado: { type: String, required: true },
})

const ETIQUETAS = {
  PENDIENTE: 'PENDIENTE',
  EN_COLA: 'EN COLA',
  PROCESANDO: 'PROCESANDO',
  RESPONDIDA: 'RESPONDIDA',
  ERROR: 'ERROR',
}
</script>

<template>
  <span class="status-badge" :class="'badge-' + (estado ? estado.toLowerCase().replace('_', '') : 'def')">
    <span class="badge-dot"></span>
    <span class="badge-label">{{ ETIQUETAS[estado] || estado }}</span>
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  white-space: nowrap;
  border: 1px solid transparent;
  user-select: none;
  transition: all 0.2s ease;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* EN COLA - Azul eléctrico */
.badge-encola {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}
.badge-encola .badge-dot {
  background: #2563eb;
  box-shadow: 0 0 6px #2563eb;
}

/* PROCESANDO - Violeta moderno con pulso */
.badge-procesando {
  background: #faf5ff;
  color: #7e22ce;
  border-color: #e9d5ff;
}
.badge-procesando .badge-dot {
  background: #9333ea;
  animation: pulse-dot 1.2s infinite;
}

/* RESPONDIDA - Esmeralda fresca */
.badge-respondida {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}
.badge-respondida .badge-dot {
  background: #10b981;
}

/* ERROR - Carmesí */
.badge-error {
  background: #fff1f2;
  color: #be123c;
  border-color: #fecdd3;
}
.badge-error .badge-dot {
  background: #f43f5e;
}

/* PENDIENTE - Ámbar */
.badge-pendiente {
  background: #fffbeb;
  color: #b45309;
  border-color: #fde68a;
}
.badge-pendiente .badge-dot {
  background: #f59e0b;
}

.badge-def {
  background: #f1f5f9;
  color: #475569;
}
.badge-def .badge-dot {
  background: #94a3b8;
}

@keyframes pulse-dot {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.8; }
}
</style>
