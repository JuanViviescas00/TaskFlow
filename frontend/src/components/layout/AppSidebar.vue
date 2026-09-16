<script setup>
// Barra lateral de navegación con soporte responsive (doc §3.2, §10, HU-14)
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
    <!-- Overlay móvil para cerrar al hacer clic afuera -->
    <div
      v-if="isOpen"
      class="sidebar-backdrop"
      @click="closeSidebar"
    ></div>

    <aside class="sidebar" :class="{ 'sidebar-open': isOpen }">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-icon">⚡</div>
          <div>
            <h1>TASKFLOW</h1>
            <p>Gestión de Solicitudes</p>
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

      <nav class="sidebar-nav">
        <RouterLink to="/dashboard" @click="closeSidebar">
          <span class="nav-icon">📊</span>
          <span>Dashboard</span>
        </RouterLink>
        <RouterLink to="/solicitudes" @click="closeSidebar">
          <span class="nav-icon">📋</span>
          <span>Solicitudes</span>
        </RouterLink>
        <RouterLink to="/solicitudes/nueva" @click="closeSidebar">
          <span class="nav-icon">➕</span>
          <span>Nueva solicitud</span>
        </RouterLink>
        <RouterLink to="/monitor" @click="closeSidebar">
          <span class="nav-icon">🖥️</span>
          <span>Monitor</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="connection-status">
          <span class="punto" :class="connected ? 'verde' : 'rojo'"></span>
          <span>{{ connected ? 'Socket en línea' : 'Sin conexión socket' }}</span>
        </div>
        <div class="version-tag">v1.0.0 • Full Stack</div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(2px);
  z-index: 990;
}

.sidebar {
  width: 250px;
  background: #0f172a;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  gap: 28px;
  position: sticky;
  top: 0;
  height: 100vh;
  border-right: 1px solid #1e293b;
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.sidebar-logo h1 {
  font-size: 1.2rem;
  letter-spacing: 0.5px;
  color: #ffffff;
  font-weight: 700;
  line-height: 1.2;
}

.sidebar-logo p {
  font-size: 0.72rem;
  color: #94a3b8;
}

.btn-close-mobile {
  display: none;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.sidebar-nav a {
  color: #94a3b8;
  text-decoration: none;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.92rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.15s ease;
}

.sidebar-nav a:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #f8fafc;
}

.sidebar-nav a.router-link-active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.nav-icon {
  font-size: 1.1rem;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.connection-status {
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
}

.punto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.punto.verde {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.punto.rojo {
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
}

.version-tag {
  font-size: 0.68rem;
  color: #64748b;
}

/* Responsive Móvil */
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
    height: 100vh;
    transform: translateX(-100%);
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.3);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }
}
</style>
