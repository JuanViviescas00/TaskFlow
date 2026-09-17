<script setup>
// Barra superior elegante con banner oscuro inspirado en el diseño de referencia
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRequestStore } from '../../store/requestStore'

const props = defineProps({
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
      return 'Panel de Control'
    case 'solicitudes':
      return 'Gestión de Solicitudes'
    case 'solicitud-nueva':
      return 'Registro de Nueva Solicitud'
    case 'solicitud-detalle':
      return 'Detalle de Solicitud'
    case 'monitor':
      return 'Monitor del Sistema & Worker'
    default:
      return 'TaskFlow'
  }
})
</script>

<template>
  <header class="top-navbar">
    <div class="navbar-left">
      <button
        type="button"
        class="menu-toggle-btn"
        @click="emit('toggle-sidebar')"
        aria-label="Abrir menú de navegación"
      >
        <span class="hamburger-icon">☰</span>
      </button>

      <div class="header-titles">
        <h1 class="main-title">{{ pageTitle }}</h1>
      </div>
    </div>

    <div class="navbar-right">
      <!-- Indicador activo de worker -->
      <div v-if="store.hayActividad" class="active-badge" title="Worker procesando cola Redis">
        <span class="pulse-dot"></span>
        <span class="activity-text">Worker procesando</span>
      </div>

      <!-- Conexión Socket -->
      <div class="socket-pill" :class="connected ? 'connected' : 'disconnected'">
        <span class="socket-dot"></span>
        <span class="socket-text">{{ connected ? 'Socket en línea' : 'Desconectado' }}</span>
      </div>

      <!-- Botón de acción rápida -->
      <RouterLink
        v-if="route.path !== '/solicitudes/nueva'"
        to="/solicitudes/nueva"
        class="btn-new-action"
      >
        <span class="btn-icon">➕</span>
        <span class="btn-label">Nueva Solicitud</span>
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.top-navbar {
  height: 62px;
  background: #0d3830; /* Verde oscuro elegante como el encabezado de referencia */
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 900;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.15s;
}

.menu-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.main-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.2px;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.active-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(250, 204, 21, 0.15);
  border: 1px solid rgba(250, 204, 21, 0.3);
  border-radius: 20px;
  font-size: 0.76rem;
  color: #fef08a;
  font-weight: 600;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #facc15;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
  70% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(250, 204, 21, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
}

.socket-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.socket-pill.connected {
  color: #86efac;
}
.socket-pill.disconnected {
  color: #fca5a5;
}

.socket-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.socket-pill.connected .socket-dot {
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}
.socket-pill.disconnected .socket-dot {
  background: #ef4444;
}

.btn-new-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #22c55e;
  color: #064e3b;
  text-decoration: none;
  font-size: 0.84rem;
  font-weight: 700;
  padding: 7px 14px;
  border-radius: 8px;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.btn-new-action:hover {
  background: #4ade80;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .top-navbar {
    padding: 0 16px;
  }
  .main-title {
    font-size: 1rem;
  }
  .btn-label, .activity-text {
    display: none;
  }
  .btn-new-action {
    padding: 7px 10px;
  }
}
</style>
