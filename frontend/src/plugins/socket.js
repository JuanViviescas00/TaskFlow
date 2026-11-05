import { io } from 'socket.io-client'

// Plugin Socket.IO (doc §21.4): conexión al backend con reconexión automática.
// En desarrollo conecta a http://localhost:3001.
// En producción, al omitir URL se conecta automáticamente al mismo origen del navegador.
const defaultUrl = import.meta.env.PROD ? undefined : 'http://localhost:3001'
const URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : defaultUrl

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
