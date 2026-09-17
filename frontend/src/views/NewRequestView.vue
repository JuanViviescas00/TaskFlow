<script setup>
// Pantalla de nueva solicitud con diseño de superficie limpia y banner superior
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
    toast.success(`Solicitud #${id ? id.slice(-6) : ''} registrada correctamente`, 'Éxito')

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
  <div class="page-container">
    <!-- Barra decorativa superior -->
    <div class="inner-banner-bar">
      <span>FORMULARIO DE REGISTRO & ATENCIÓN AUTOMÁTICA</span>
    </div>

    <!-- Superficie principal -->
    <div class="main-surface-card">
      <div class="surface-header">
        <div class="title-group">
          <h2 class="main-page-title">Crear Nueva Solicitud</h2>
          <p class="main-page-sub">Registra una petición para ser procesada asíncronamente por el Worker</p>
        </div>

        <RouterLink to="/solicitudes" class="btn-back-link">
          ← Volver a Mis Solicitudes
        </RouterLink>
      </div>

      <div class="content-grid">
        <!-- Columna Formulario -->
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

        <!-- Columna Lateral Informativa estilo referencia -->
        <aside class="info-column">
          <div class="info-card-box">
            <div class="info-box-header">
              <span class="info-badge-icon">💡</span>
              <h4>Arquitectura del Proceso</h4>
            </div>
            <ul class="steps-list">
              <li>
                <strong>1. MongoDB:</strong> Almacena la solicitud con su estado y fecha.
              </li>
              <li>
                <strong>2. Redis Queue:</strong> Encola el identificador (<code>cola:solicitudes</code>).
              </li>
              <li>
                <strong>3. Worker Node.js:</strong> Extrae la solicitud, evalúa la categoría y genera la respuesta.
              </li>
              <li>
                <strong>4. Vue 3 (Socket.IO):</strong> Recibe la respuesta en tiempo real sin recargar la pantalla.
              </li>
            </ul>
          </div>

          <div class="categories-box">
            <h4>Categorías y Reglas Sugeridas</h4>
            <div class="cat-pill-list">
              <div class="cat-item">
                <span class="cat-tag info">Información</span>
                <p>Horarios de atención, requisitos y canales de contacto.</p>
              </div>
              <div class="cat-item">
                <span class="cat-tag support">Soporte</span>
                <p>Incidencias de acceso, fallas o soporte técnico.</p>
              </div>
              <div class="cat-item">
                <span class="cat-tag doc">Documento</span>
                <p>Certificados laborales, constancias o constancias de estudio.</p>
              </div>
              <div class="cat-item">
                <span class="cat-tag query">Consulta</span>
                <p>Estado de trámites y avance de procesos.</p>
              </div>
              <div class="cat-item">
                <span class="cat-tag update">Actualización</span>
                <p>Modificación o actualización de datos registrados.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 1300px;
  margin: 0 auto;
}

.inner-banner-bar {
  background: #0d3830;
  color: #86efac;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 10px 24px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
}

.main-surface-card {
  background: #f4f7f6;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-top: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.surface-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 16px;
}

.main-page-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: #0d3830;
  letter-spacing: -0.5px;
}

.main-page-sub {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 4px;
}

.btn-back-link {
  background: white;
  border: 1px solid #cbd5e1;
  color: #0d3830;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s;
}
.btn-back-link:hover {
  background: #e2ece9;
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

.info-card-box,
.categories-box {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.info-box-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.info-badge-icon {
  font-size: 1.25rem;
}

.info-box-header h4,
.categories-box h4 {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0d3830;
}

.steps-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.5;
}

.steps-list code {
  background: #f1f5f9;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.cat-pill-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.cat-item {
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 8px;
}
.cat-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.cat-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.cat-tag.info { background: #dbeafe; color: #1e40af; }
.cat-tag.support { background: #fef3c7; color: #92400e; }
.cat-tag.doc { background: #dcfce7; color: #166534; }
.cat-tag.query { background: #ede9fe; color: #5b21b6; }
.cat-tag.update { background: #fce7f3; color: #9d174d; }

.cat-item p {
  font-size: 0.8rem;
  color: #64748b;
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
