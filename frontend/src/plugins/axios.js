import axios from 'axios'

// Plugin axios centralizado (doc §3.10).
// En desarrollo local apunta a http://localhost:3001 si no se define VITE_API_URL.
// En producción servido por Express, usa URL relativa ('') para conectar al mismo origen.
const baseURL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.PROD ? '' : 'http://localhost:3001')

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export default {
  install(app) {
    app.config.globalProperties.$api = apiClient
  },
}

export { apiClient }
