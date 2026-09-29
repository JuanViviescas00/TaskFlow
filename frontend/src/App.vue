<script setup>
// Layout principal profesional (doc §3.8) con accesibilidad, navegación SVG y responsive mobile
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { socket } from './plugins/socket'

const router = useRouter()
const conectado = ref(socket.connected)
const menuAbierto = ref(false)

function toggleMenu() {
  menuAbierto.value = !menuAbierto.value
}

function cerrarMenu() {
  menuAbierto.value = false
}

onMounted(() => {
  socket.on('connect', () => (conectado.value = true))
  socket.on('disconnect', () => (conectado.value = false))
})

onUnmounted(() => {
  socket.off('connect')
  socket.off('disconnect')
})
</script>

<template>
  <div class="app">
    <!-- Overlay móvil para cerrar sidebar -->
    <div 
      v-if="menuAbierto" 
      class="sidebar-overlay" 
      @click="cerrarMenu"
      aria-hidden="true"
    ></div>

    <aside class="sidebar" :class="{ 'abierto': menuAbierto }">
      <div class="sidebar-logo">
        <div class="logo-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </div>
        <div>
          <h1>TASKFLOW</h1>
          <p>Motor Asíncrono</p>
        </div>
      </div>

      <nav aria-label="Navegación principal">
        <RouterLink to="/dashboard" @click="cerrarMenu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard
        </RouterLink>

        <RouterLink to="/solicitudes" @click="cerrarMenu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          Solicitudes
        </RouterLink>

        <RouterLink to="/solicitudes/nueva" @click="cerrarMenu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Nueva solicitud
        </RouterLink>

        <RouterLink to="/monitor" @click="cerrarMenu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
          Monitor
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="socket-pill" :class="conectado ? 'conectado' : 'desconectado'">
          <span class="punto" :class="conectado ? 'verde' : 'rojo'"></span>
          <span>{{ conectado ? 'En vivo' : 'Desconectado' }}</span>
        </div>
      </div>
    </aside>

    <div class="main-wrapper">
      <!-- Barra superior responsiva para dispositivos móviles -->
      <header class="topbar-mobile">
        <button class="menu-toggle" @click="toggleMenu" aria-label="Abrir menú de navegación">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <span class="mobile-brand">TASKFLOW</span>
        <span class="punto" :class="conectado ? 'verde' : 'rojo'" :title="conectado ? 'En vivo' : 'Desconectado'"></span>
      </header>

      <main class="contenido">
        <RouterView />
      </main>
    </div>
  </div>
</template>
