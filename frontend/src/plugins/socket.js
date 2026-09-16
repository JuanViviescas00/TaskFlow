import { io } from 'socket.io-client'

// Plugin Socket.IO (doc §21.4): conexión al backend con reconexión automática.
const URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const socket = io(URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
})

socket.on('connect', () => console.log('[socket] Conectado al backend'))
socket.on('disconnect', () => console.warn('[socket] Desconectado; reintentando...'))

export default {
  install(app) {
    app.config.globalProperties.$socket = socket
  },
}

export { socket }
