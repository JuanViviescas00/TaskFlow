import axios from 'axios'

// Plugin axios centralizado (doc §3.10). La URL base se toma del entorno
// para adaptarse a cada entorno (local, Docker, producción).
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export default {
  install(app) {
    app.config.globalProperties.$api = apiClient
  },
}

export { apiClient }
