<script setup>
// Nueva solicitud (doc §15.2): formulario con validación visual (HU-01).
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
    errorGeneral.value = 'Revisa los campos marcados antes de enviar.'
    return
  }

  enviando.value = true
  try {
    const respuesta = await crearSolicitud(form.value)
    exito.value = `Solicitud registrada con estado ${respuesta.solicitud.estado}. Pasó a la cola de procesamiento.`
    form.value = { titulo: '', descripcion: '', categoria: '', prioridad: 'Media' }
    errores.value = {}
    setTimeout(() => router.push('/solicitudes'), 1800)
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
      errorGeneral.value = 'No se pudo conectar con el backend.'
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
        <h2>Nueva solicitud</h2>
        <p>Registra una solicitud para su procesamiento</p>
      </div>
    </header>

    <form class="panel formulario" @submit.prevent="enviar">
      <p v-if="errorGeneral" class="alerta error">{{ errorGeneral }}</p>
      <p v-if="exito" class="alerta ok">{{ exito }}</p>

      <label>
        Título *
        <input
          v-model="form.titulo"
          type="text"
          maxlength="120"
          placeholder="Ej: Solicitud de certificado"
          :class="{ invalido: errores.titulo }"
        />
        <small v-if="errores.titulo" class="error-texto">{{ errores.titulo }}</small>
      </label>

      <label>
        Descripción *
        <textarea
          v-model="form.descripcion"
          rows="4"
          maxlength="2000"
          placeholder="Describe tu solicitud con detalle"
          :class="{ invalido: errores.descripcion }"
        ></textarea>
        <small v-if="errores.descripcion" class="error-texto">{{ errores.descripcion }}</small>
      </label>

      <div class="fila">
        <label>
          Categoría *
          <select v-model="form.categoria" :class="{ invalido: errores.categoria }">
            <option value="" disabled>Selecciona una categoría</option>
            <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
          </select>
          <small v-if="errores.categoria" class="error-texto">{{ errores.categoria }}</small>
        </label>

        <label>
          Prioridad *
          <select v-model="form.prioridad" :class="{ invalido: errores.prioridad }">
            <option v-for="p in PRIORIDADES" :key="p" :value="p">{{ p }}</option>
          </select>
          <small v-if="errores.prioridad" class="error-texto">{{ errores.prioridad }}</small>
        </label>
      </div>

      <div class="acciones">
        <button type="button" class="btn" @click="cancelar">Cancelar</button>
        <button type="submit" class="btn primario" :disabled="enviando">
          {{ enviando ? 'Enviando...' : 'Enviar solicitud' }}
        </button>
      </div>
    </form>
  </section>
</template>
