import { onMounted, onUnmounted } from 'vue'
import { socket } from '../plugins/socket'

// Composable para escuchar eventos Socket.IO (doc §21.4).
// Registra los listeners al montar y los retira al desmontar.
export function useSocket(eventos) {
  const handlers = []

  onMounted(() => {
    for (const [evento, callback] of Object.entries(eventos)) {
      socket.on(evento, callback)
      handlers.push([evento, callback])
    }
  })

  onUnmounted(() => {
    for (const [evento, callback] of handlers) {
      socket.off(evento, callback)
    }
  })
}
