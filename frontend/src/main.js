import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from './plugins/axios'
import socket from './plugins/socket'
import './styles/main.css'

// Bootstrap de la app Vue (doc §3): router, plugins y estilos globales.

const app = createApp(App)
app.use(router)
app.use(axios)
app.use(socket)
app.mount('#app')
