<script setup>
// Barra lateral de navegación inspirada en el diseño moderno de referencia
import { socket } from '../../plugins/socket'

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  connected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

function closeSidebar() {
  emit('close')
}
</script>

<template>
  <div>
    <!-- Overlay móvil -->
    <div
      v-if="isOpen"
      class="sidebar-backdrop"
      @click="closeSidebar"
    ></div>

    <aside class="sidebar" :class="{ 'sidebar-open': isOpen }">
      <!-- Logo Superior -->
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-box">
            <span class="logo-symbol">⚡</span>
          </div>
          <div class="logo-text">
            <h2>TaskFlow</h2>
            <span class="logo-sub">Gestión de Solicitudes</span>
          </div>
        </div>
        <button
          type="button"
          class="btn-close-mobile"
          @click="closeSidebar"
          aria-label="Cerrar menú"
        >
          ✕
        </button>
      </div>

      <!-- Sección Navegación -->
      <div class="nav-section-title">NAVEGACIÓN</div>

      <nav class="sidebar-nav">
        <RouterLink to="/dashboard" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Dashboard</span>
        </RouterLink>
        <RouterLink to="/solicitudes" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">📋</span>
          <span class="nav-label">Mis Solicitudes</span>
        </RouterLink>
        <RouterLink to="/solicitudes/nueva" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">➕</span>
          <span class="nav-label">Nueva Solicitud</span>
        </RouterLink>
        <RouterLink to="/monitor" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">🖥️</span>
          <span class="nav-label">Monitor del Sistema</span>
        </RouterLink>
      </nav>

      <!-- Pie de navegación -->
      <div class="sidebar-footer">
        <div class="status-pill" :class="connected ? 'online' : 'offline'">
          <span class="status-dot"></span>
          <span class="status-text">{{ connected ? 'Socket en línea' : 'Socket desconectado' }}</span>
        </div>
        <div class="footer-info">SENA • Docker Compose Full Stack</div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
  z-index: 990;
}

.sidebar {
  width: 250px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 22px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 1000;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.02);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 20px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-box {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #0d3830, #14532d);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(13, 56, 48, 0.25);
}

.logo-symbol {
  font-size: 1.25rem;
  color: #86efac;
}

.logo-text h2 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f2b24;
  letter-spacing: -0.3px;
  line-height: 1.1;
}

.logo-sub {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 500;
}

.btn-close-mobile {
  display: none;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
}

.nav-section-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 12px;
  padding-left: 10px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  color: #334155;
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Estado activo estilo píldora como en el diseño de referencia */
.nav-item.router-link-active {
  background: #dcfce7;
  color: #14532d;
  font-weight: 700;
}

.nav-icon {
  font-size: 1.1rem;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
}

.status-pill.online {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.status-pill.offline {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-pill.online .status-dot {
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}

.status-pill.offline .status-dot {
  background: #ef4444;
}

.footer-info {
  font-size: 0.68rem;
  color: #94a3b8;
  padding-left: 4px;
}

@media (max-width: 900px) {
  .sidebar-backdrop {
    display: block;
  }
  .btn-close-mobile {
    display: block;
  }
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    transform: translateX(-100%);
    box-shadow: 10px 0 25px rgba(0, 0, 0, 0.15);
  }
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
}
</style>
