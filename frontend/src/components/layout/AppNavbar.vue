<script setup>
// Barra superior moderna y limpia (Navbar)
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRequestStore } from '../../store/requestStore'

defineProps({
  connected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-sidebar'])
const route = useRoute()
const store = useRequestStore()

const pageTitle = computed(() => {
  switch (route.name) {
    case 'dashboard':
      return 'Dashboard'
    case 'solicitudes':
      return 'Gestión de Solicitudes'
    case 'solicitud-nueva':
      return 'Nueva Solicitud'
    case 'solicitud-detalle':
      return 'Detalle de Solicitud'
    case 'monitor':
      return 'Monitor del Sistema'
    default:
      return 'TASKFLOW'
  }
})
</script>

<template>
  <header class="navbar">
    <div class="navbar-left">
      <button
        type="button"
        class="btn-hamburger"
        @click="emit('toggle-sidebar')"
        aria-label="Abrir menú"
      >
        <span>☰</span>
      </button>

      <h1 class="header-title">{{ pageTitle }}</h1>
    </div>

    <div class="navbar-right">
      <!-- Indicador activo de worker -->
      <div v-if="store.hayActividad" class="active-badge" title="Worker procesando cola Redis">
        <span class="pulse-dot"></span>
        <span class="activity-text">Worker activo</span>
      </div>

      <!-- Conexión Socket -->
      <div class="connection-badge" :class="connected ? 'connected' : 'disconnected'">
        <span class="conn-dot"></span>
        <span class="conn-text">{{ connected ? 'En línea' : 'Desconectado' }}</span>
      </div>

      <!-- Botón de acción rápida -->
      <RouterLink
        v-if="route.path !== '/solicitudes/nueva'"
        to="/solicitudes/nueva"
        class="btn-add"
      >
        <span>+</span>
        <span class="btn-text">Nueva Solicitud</span>
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 900;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.btn-hamburger {
  display: none;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  color: #334155;
  cursor: pointer;
}

.header-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.active-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 20px;
  font-size: 0.76rem;
  color: #1d4ed8;
  font-weight: 600;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2563eb;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
  70% { transform: scale(1.15); box-shadow: 0 0 0 5px rgba(37, 99, 235, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
}

.connection-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 500;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.connection-badge.connected {
  color: #15803d;
}
.connection-badge.disconnected {
  color: #b91c1c;
}

.conn-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.connection-badge.connected .conn-dot {
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}
.connection-badge.disconnected .conn-dot {
  background: #ef4444;
}

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #2563eb;
  color: #ffffff;
  text-decoration: none;
  font-size: 0.84rem;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 8px;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
}

.btn-add:hover {
  background: #1d4ed8;
}

@media (max-width: 900px) {
  .btn-hamburger { display: inline-flex; }
  .navbar { padding: 0 16px; }
}

@media (max-width: 600px) {
  .btn-text, .activity-text { display: none; }
  .btn-add { padding: 7px 10px; }
}
</style>
