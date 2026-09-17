<script setup>
// Layout principal (doc §3.8, HU-12): Sidebar, Navbar, ToastContainer y área principal
import { ref, onMounted, onUnmounted } from 'vue'
import AppSidebar from '../components/layout/AppSidebar.vue'
import AppNavbar from '../components/layout/AppNavbar.vue'
import ToastContainer from '../components/common/ToastContainer.vue'
import { socket } from '../plugins/socket'

const sidebarOpen = ref(false)
const connected = ref(socket.connected)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

onMounted(() => {
  socket.on('connect', () => (connected.value = true))
  socket.on('disconnect', () => (connected.value = false))
})

onUnmounted(() => {
  socket.off('connect')
  socket.off('disconnect')
})
</script>

<template>
  <div class="layout-wrapper">
    <AppSidebar
      :is-open="sidebarOpen"
      :connected="connected"
      @close="closeSidebar"
    />

    <div class="layout-main">
      <AppNavbar
        :connected="connected"
        @toggle-sidebar="toggleSidebar"
      />

      <main class="layout-content">
        <slot />
      </main>
    </div>

    <!-- Sistema global de toasts -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.layout-wrapper {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* previene desborde en flexbox */
}

.layout-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .layout-content {
    padding: 16px;
  }
}
</style>
