<script setup>
// Registro de nueva solicitud (doc §15.2): validación cliente-servidor y envío asíncrono
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { crearSolicitud } from '../services/requestService'
import { CATEGORIAS, PRIORIDADES, validarSolicitud } from '../utils/format'

const router = useRouter()

const form = ref({
  titulo: '',
  descripcion: '',
  categoria: '',
  prioridad: 'Media',
})
const errores = ref({})
const enviando = ref(false)
const exito = ref('')
const errorGeneral = ref('')

async function enviar() {
  exito.value = ''
  errorGeneral.value = ''
  errores.value = validarSolicitud(form.value)

  if (Object.keys(errores.value).length > 0) {
    errorGeneral.value = 'Por favor completa correctamente los campos obligatorios.'
    return
  }

  enviando.value = true
  try {
    const respuesta = await crearSolicitud(form.value)
    exito.value = `Solicitud registrada con éxito (estado ${respuesta.solicitud.estado}). Redirigiendo...`
    form.value = { titulo: '', descripcion: '', categoria: '', prioridad: 'Media' }
    errores.value = {}
    setTimeout(() => router.push('/solicitudes'), 1500)
  } catch (e) {
    if (e.response?.data) {
      const { error, detalles } = e.response.data
      errorGeneral.value = error
      errores.value = {}
      for (const detalle of detalles || []) {
        if (detalle.includes('título')) errores.value.titulo = detalle
        else if (detalle.includes('descripción')) errores.value.descripcion = detalle
        else if (detalle.includes('categoría')) errores.value.categoria = detalle
        else errores.value.general = detalle
      }
    } else {
      errorGeneral.value = 'No se pudo conectar con el servidor de la API.'
    }
  } finally {
    enviando.value = false
  }
}

function cancelar() {
  router.push('/solicitudes')
}
</script>

<template>
  <section class="vista estrecha">
    <header class="vista-header">
      <div>
        <div class="breadcrumb-nav">
          <RouterLink to="/solicitudes" class="breadcrumb-link">Solicitudes</RouterLink>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">Nueva</span>
        </div>
        <h2>Nueva solicitud</h2>
        <p>Ingresa una solicitud al sistema para su procesamiento asíncrono</p>
      </div>
      <button type="button" class="btn" @click="cancelar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Cancelar
      </button>
    </header>

    <div v-if="errorGeneral" class="alerta error" role="alert">
      <span>{{ errorGeneral }}</span>
    </div>
    <div v-if="exito" class="alerta ok" role="status">
      <span>{{ exito }}</span>
    </div>

    <!-- Formulario estándar plano sin contenedor tipo card -->
    <form class="formulario" @submit.prevent="enviar" novalidate>
      <label>
        <span class="label-texto">
          Título de la solicitud
          <span class="campo-requerido" title="Obligatorio">*</span>
        </span>
        <input
          v-model="form.titulo"
          type="text"
          maxlength="120"
          placeholder="Ej: Solicitud de certificado laboral"
          :class="{ invalido: errores.titulo }"
          aria-required="true"
        />
        <span class="input-hint">Máximo 120 caracteres</span>
        <small v-if="errores.titulo" class="error-texto">{{ errores.titulo }}</small>
      </label>

      <label>
        <span class="label-texto">
          Descripción detallada
          <span class="campo-requerido" title="Obligatorio">*</span>
        </span>
        <textarea
          v-model="form.descripcion"
          rows="4"
          maxlength="2000"
          placeholder="Describe claramente los detalles, motivos o antecedentes..."
          :class="{ invalido: errores.descripcion }"
          aria-required="true"
        ></textarea>
        <span class="input-hint">Detalla la información necesaria para que el Worker genere la respuesta</span>
        <small v-if="errores.descripcion" class="error-texto">{{ errores.descripcion }}</small>
      </label>

      <div class="fila">
        <label>
          <span class="label-texto">
            Categoría
            <span class="campo-requerido" title="Obligatorio">*</span>
          </span>
          <select v-model="form.categoria" :class="{ invalido: errores.categoria }" aria-required="true">
            <option value="" disabled>Selecciona una categoría</option>
            <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
          </select>
          <small v-if="errores.categoria" class="error-texto">{{ errores.categoria }}</small>
        </label>

        <label>
          <span class="label-texto">
            Nivel de Prioridad
            <span class="campo-requerido" title="Obligatorio">*</span>
          </span>
          <select v-model="form.prioridad" :class="{ invalido: errores.prioridad }" aria-required="true">
            <option v-for="p in PRIORIDADES" :key="p" :value="p">{{ p }}</option>
          </select>
          <small v-if="errores.prioridad" class="error-texto">{{ errores.prioridad }}</small>
        </label>
      </div>

      <div class="acciones">
        <button type="button" class="btn" @click="cancelar">Descartar</button>
        <button type="submit" class="btn primario" :disabled="enviando">
          <span v-if="enviando" class="spinner" style="width: 14px; height: 14px; margin-right: 8px;"></span>
          {{ enviando ? 'Registrando solicitud...' : 'Enviar solicitud' }}
        </button>
      </div>
    </form>
  </section>
</template>
