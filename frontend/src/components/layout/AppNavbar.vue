<script setup>
// Barra de navegación superior con menú responsive (doc §3.2, §10, HU-14)
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
      return 'Dashboard Principal'
    case 'solicitudes':
      return 'Gestión de Solicitudes'
    case 'solicitud-nueva':
      return 'Registro de Solicitud'
    case 'solicitud-detalle':
      return 'Detalle de Solicitud'
    case 'monitor':
      return 'Monitor de Servicios'
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
        class="menu-btn"
        @click="emit('toggle-sidebar')"
        aria-label="Abrir menú de navegación"
      >
        <span class="hamburger-icon">☰</span>
      </button>
      <div class="navbar-title-container">
        <h2 class="navbar-title">{{ pageTitle }}</h2>
      </div>
    </div>

    <div class="navbar-right">
      <div v-if="store.hayActividad" class="active-badge" title="Worker procesando solicitudes en segundo plano">
        <span class="pulse-dot"></span>
        <span class="activity-text">Worker activo</span>
      </div>

      <div class="quick-status">
        <span class="punto-mini" :class="connected ? 'verde' : 'rojo'"></span>
        <span class="socket-label">{{ connected ? 'En línea' : 'Desconectado' }}</span>
      </div>

      <RouterLink
        v-if="route.path !== '/solicitudes/nueva'"
        to="/solicitudes/nueva"
        class="btn-new-req"
      >
        <span class="plus-icon">+</span>
        <span class="btn-text">Nueva solicitud</span>
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  height: 64px;
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
  gap: 16px;
}

.menu-btn {
  display: none;
  background: transparent;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #334155;
  cursor: pointer;
  transition: background 0.15s;
}

.menu-btn:hover {
  background: #f1f5f9;
}

.navbar-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0f172a;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.active-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 20px;
  font-size: 0.78rem;
  color: #1d4ed8;
  font-weight: 500;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2563eb;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(37, 99, 235, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
}

.quick-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #64748b;
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.punto-mini {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.punto-mini.verde { background: #22c55e; }
.punto-mini.rojo { background: #ef4444; }

.btn-new-req {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #2563eb;
  color: white;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.15s ease;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}

.btn-new-req:hover {
  background: #1d4ed8;
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
}

@media (max-width: 900px) {
  .menu-btn {
    display: inline-flex;
  }
  .navbar {
    padding: 0 16px;
  }
}

@media (max-width: 600px) {
  .btn-text, .socket-label, .activity-text {
    display: none;
  }
  .quick-status {
    padding: 6px;
  }
  .navbar-title {
    font-size: 1rem;
  }
}
</style>
