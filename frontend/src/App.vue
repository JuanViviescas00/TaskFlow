<script setup>
// Layout principal (doc §3.8): menú lateral, encabezado y área de contenido.
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { socket } from './plugins/socket'

const router = useRouter()
const conectado = ref(socket.connected)

function irA(ruta) {
  router.push(ruta)
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
    <aside class="sidebar">
      <div class="sidebar-logo">
        <h1>TASKFLOW</h1>
        <p>Gestión de solicitudes</p>
      </div>
      <nav>
        <RouterLink to="/dashboard">📊 Dashboard</RouterLink>
        <RouterLink to="/solicitudes">📋 Solicitudes</RouterLink>
        <RouterLink to="/solicitudes/nueva">➕ Nueva solicitud</RouterLink>
        <RouterLink to="/monitor">🖥️ Monitor</RouterLink>
      </nav>
      <div class="sidebar-footer">
        <span class="punto" :class="conectado ? 'verde' : 'rojo'"></span>
        {{ conectado ? 'Socket conectado' : 'Socket desconectado' }}
      </div>
    </aside>

    <main class="contenido">
      <RouterView />
    </main>
  </div>
</template>
