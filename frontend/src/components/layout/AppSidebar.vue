<script setup>
// Barra lateral moderna y profesional de TASKFLOW
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
    <!-- Overlay para móvil -->
    <div
      v-if="isOpen"
      class="sidebar-backdrop"
      @click="closeSidebar"
    ></div>

    <aside class="sidebar" :class="{ 'sidebar-open': isOpen }">
      <!-- Logo de la marca -->
      <div class="sidebar-brand">
        <div class="brand-icon">
          <span>⚡</span>
        </div>
        <div class="brand-text">
          <span class="brand-name">TASKFLOW</span>
          <span class="brand-tag">Gestión de Solicitudes</span>
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

      <!-- Menú de Navegación -->
      <nav class="sidebar-nav">
        <span class="nav-heading">MENÚ PRINCIPAL</span>

        <RouterLink to="/dashboard" class="nav-link" @click="closeSidebar">
          <span class="link-icon">📊</span>
          <span class="link-text">Dashboard</span>
        </RouterLink>

        <RouterLink to="/solicitudes" class="nav-link" @click="closeSidebar">
          <span class="link-icon">📋</span>
          <span class="link-text">Solicitudes</span>
        </RouterLink>

        <RouterLink to="/solicitudes/nueva" class="nav-link" @click="closeSidebar">
          <span class="link-icon">➕</span>
          <span class="link-text">Nueva Solicitud</span>
        </RouterLink>

        <span class="nav-heading" style="margin-top: 14px;">INFRAESTRUCTURA</span>

        <RouterLink to="/monitor" class="nav-link" @click="closeSidebar">
          <span class="link-icon">🖥️</span>
          <span class="link-text">Monitor & Worker</span>
        </RouterLink>
      </nav>

      <!-- Pie de barra con estado del Socket -->
      <div class="sidebar-footer">
        <div class="socket-status" :class="connected ? 'online' : 'offline'">
          <span class="status-dot"></span>
          <span>{{ connected ? 'Socket en línea' : 'Desconectado' }}</span>
        </div>
        <span class="footer-version">v1.0.0 • Full Stack SENA</span>
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
  width: 240px;
  background: #0f172a; /* Slate 900 elegante de herramientas como Linear / Vercel */
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 1000;
  border-right: 1px solid #1e293b;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px 18px 8px;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 16px;
}

.brand-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #ffffff;
  line-height: 1.1;
}

.brand-tag {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}

.btn-close-mobile {
  display: none;
  margin-left: auto;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-heading {
  font-size: 0.68rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.8px;
  padding: 8px 12px 4px 12px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.nav-link.router-link-active {
  background: #2563eb;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.link-icon {
  font-size: 1.05rem;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 6px;
}

.socket-status {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.78rem;
  font-weight: 600;
}

.socket-status.online { color: #4ade80; }
.socket-status.offline { color: #f87171; }

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.socket-status.online .status-dot {
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}
.socket-status.offline .status-dot {
  background: #ef4444;
}

.footer-version {
  font-size: 0.68rem;
  color: #64748b;
}

@media (max-width: 900px) {
  .sidebar-backdrop { display: block; }
  .btn-close-mobile { display: block; }
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    transform: translateX(-100%);
    box-shadow: 10px 0 25px rgba(0, 0, 0, 0.3);
  }
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
}
</style>
