<script setup>
// Contenedor flotante de notificaciones Toasts para eventos en tiempo real (HU-16)
import { useToast } from '../../composables/useToast'

const { toasts, removeToast } = useToast()

const ICONOS = {
  success: '✓',
  error: '✕',
  warning: '⚠️',
  info: 'ℹ️',
}
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-card"
        :class="toast.type"
      >
        <span class="toast-icon">{{ ICONOS[toast.type] || '🔔' }}</span>
        <div class="toast-body">
          <strong v-if="toast.title" class="toast-title">{{ toast.title }}</strong>
          <p class="toast-msg">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="toast-close"
          @click="removeToast(toast.id)"
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
  width: calc(100% - 40px);
  pointer-events: none;
}

.toast-card {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #2563eb;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-card.success {
  border-left-color: #16a34a;
}
.toast-card.error {
  border-left-color: #dc2626;
}
.toast-card.warning {
  border-left-color: #d97706;
}
.toast-card.info {
  border-left-color: #2563eb;
}

.toast-icon {
  font-size: 1.1rem;
  line-height: 1.3;
}

.toast-body {
  flex: 1;
}

.toast-title {
  display: block;
  font-size: 0.88rem;
  color: #0f172a;
  margin-bottom: 2px;
}

.toast-msg {
  font-size: 0.82rem;
  color: #475569;
  margin: 0;
  line-height: 1.35;
}

.toast-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.toast-close:hover {
  color: #334155;
}

/* Transiciones */
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}
</style>
