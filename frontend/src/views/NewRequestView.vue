<script setup>
// Pantalla de nueva solicitud (doc §15.2, HU-01)
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

    serverSuccess.value = `¡Solicitud creada con éxito! Estado: ${estado}. Se ha enviado a la cola Redis.`
    toast.success(`Solicitud #${id ? id.slice(-6) : ''} registrada correctamente`, 'Éxito')

    if (formRef.value) {
      formRef.value.resetForm()
    }

    // Redirección suave al listado
    setTimeout(() => {
      router.push('/solicitudes')
    }, 1500)
  } catch (e) {
    if (e.response?.data) {
      const { error, detalles } = e.response.data
      serverError.value = error || 'Error al procesar la solicitud'
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
  <div class="new-request-page">
    <div class="page-top-bar">
      <div>
        <h1 class="page-heading">Crear Nueva Solicitud</h1>
        <p class="page-subheading">
          Registra una petición para ser procesada asíncronamente por el Worker
        </p>
      </div>

      <RouterLink to="/solicitudes" class="btn-back">
        ← Volver al listado
      </RouterLink>
    </div>

    <div class="content-grid">
      <div class="form-column">
        <RequestForm
          ref="formRef"
          :loading="loading"
          :server-error="serverError"
          :server-success="serverSuccess"
          @submit="onSubmit"
          @cancel="onCancel"
        />
      </div>

      <div class="info-column">
        <div class="info-card">
          <div class="info-card-header">
            <span class="info-icon">💡</span>
            <h4>¿Cómo funciona TASKFLOW?</h4>
          </div>
          <ul class="info-steps">
            <li>
              <strong>1. Registro:</strong> Tu solicitud se guarda de inmediato en la base de datos MongoDB con estado inicial.
            </li>
            <li>
              <strong>2. Encolado:</strong> Se envía un identificador a la cola Redis (<code>cola:solicitudes</code>).
            </li>
            <li>
              <strong>3. Procesamiento Asíncrono:</strong> El Worker Node.js consume la cola, cambia el estado a <code>PROCESANDO</code> y evalúa las reglas.
            </li>
            <li>
              <strong>4. Respuesta Automática:</strong> Se genera la respuesta basada en la categoría seleccionada y pasa a <code>RESPONDIDA</code>.
            </li>
          </ul>
        </div>

        <div class="categories-card">
          <h4>Categorías sugeridas</h4>
          <div class="category-item">
            <span class="badge-cat">Información</span>
            <p>Horarios, requisitos generales y canales de atención.</p>
          </div>
          <div class="category-item">
            <span class="badge-cat">Soporte</span>
            <p>Problemas de acceso o incidencias técnicas.</p>
          </div>
          <div class="category-item">
            <span class="badge-cat">Documento</span>
            <p>Solicitudes de certificados y constancias.</p>
          </div>
          <div class="category-item">
            <span class="badge-cat">Consulta</span>
            <p>Verificación de trámites en curso.</p>
          </div>
          <div class="category-item">
            <span class="badge-cat">Actualización</span>
            <p>Modificación o actualización de datos personales.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.new-request-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
}

.page-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.page-heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.page-subheading {
  font-size: 0.88rem;
  color: #64748b;
  margin-top: 2px;
}

.btn-back {
  background: white;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s;
}
.btn-back:hover {
  background: #f8fafc;
  color: #0f172a;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 24px;
  align-items: start;
}

.info-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card,
.categories-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.info-icon {
  font-size: 1.3rem;
}

.info-card-header h4,
.categories-card h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.info-steps {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.5;
}

.info-steps code {
  background: #f1f5f9;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.category-item {
  margin-top: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}
.category-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.badge-cat {
  display: inline-block;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.category-item p {
  font-size: 0.8rem;
  color: #64748b;
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
