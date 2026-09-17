<script setup>
// Pantalla de Nueva Solicitud limpia y moderna
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRequestStore } from '../store/requestStore'
import { useToast } from '../composables/useToast'
import RequestForm from '../components/requests/RequestForm.vue'

const router = useRouter()
const store = useRequestStore()
const toast = useToast()

const formRef = ref(null)
const loading = ref(false)
const serverError = ref('')
const serverSuccess = ref('')

async function onSubmit(payload) {
  loading.value = true
  serverError.value = ''
  serverSuccess.value = ''

  try {
    const respuesta = await store.registrar(payload)
    const id = respuesta.solicitud?.id
    const estado = respuesta.solicitud?.estado || 'EN_COLA'

    serverSuccess.value = `¡Solicitud registrada con éxito! Estado: ${estado}. Ha ingresado a la cola Redis.`
    toast.success(`Solicitud #${id ? id.slice(-6) : ''} creada correctamente`, 'Éxito')

    if (formRef.value) {
      formRef.value.resetForm()
    }

    setTimeout(() => {
      router.push('/solicitudes')
    }, 1500)
  } catch (e) {
    if (e.response?.data) {
      const { error, detalles } = e.response.data
      serverError.value = error || 'Error al registrar la solicitud'
      if (detalles && detalles.length > 0) {
        serverError.value += ': ' + detalles.join(', ')
      }
    } else {
      serverError.value = 'No se pudo conectar con el servidor backend.'
    }
    toast.error(serverError.value, 'Error de Registro')
  } finally {
    loading.value = false
  }
}

function onCancel() {
  router.push('/solicitudes')
}
</script>

<template>
  <div class="new-req-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Nueva Solicitud</h2>
        <p class="page-sub">Registra una petición para ser procesada asíncronamente por el Worker</p>
      </div>

      <RouterLink to="/solicitudes" class="btn-back">
        ← Volver al listado
      </RouterLink>
    </div>

    <div class="grid-content">
      <!-- Formulario -->
      <div class="form-wrapper">
        <RequestForm
          ref="formRef"
          :loading="loading"
          :server-error="serverError"
          :server-success="serverSuccess"
          @submit="onSubmit"
          @cancel="onCancel"
        />
      </div>

      <!-- Ayuda lateral -->
      <aside class="side-info">
        <div class="info-box">
          <h4 class="info-title">💡 Proceso de Atención</h4>
          <p class="info-text">
            Al enviar tu solicitud, el sistema la guarda en <strong>MongoDB</strong> y envía su referencia a una cola en <strong>Redis</strong>.
          </p>
          <p class="info-text" style="margin-top: 8px;">
            Un <strong>Worker independiente</strong> consume la cola, evalúa la categoría y responde automáticamente sin bloquear el sistema.
          </p>
        </div>

        <div class="info-box">
          <h4 class="info-title">Categorías Oficiales</h4>
          <ul class="cat-list">
            <li><strong>Información:</strong> Horarios y canales de atención.</li>
            <li><strong>Soporte:</strong> Problemas de acceso o técnicos.</li>
            <li><strong>Documento:</strong> Certificados y constancias.</li>
            <li><strong>Consulta:</strong> Estado de trámites en curso.</li>
            <li><strong>Actualización:</strong> Modificación de datos personales.</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.new-req-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.page-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
}

.page-sub {
  font-size: 0.84rem;
  color: #64748b;
  margin-top: 2px;
}

.btn-back {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
}
.btn-back:hover {
  background: #f8fafc;
}

.grid-content {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 24px;
  align-items: start;
}

.side-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-box {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.info-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 10px;
}

.info-text {
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.5;
}

.cat-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.82rem;
  color: #475569;
}

@media (max-width: 860px) {
  .grid-content {
    grid-template-columns: 1fr;
  }
}
</style>
