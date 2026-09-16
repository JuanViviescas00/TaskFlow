<script setup>
// Formulario modular de solicitud con validación visual (doc §3.2, §10, HU-01)
import { ref } from 'vue'
import { CATEGORIAS, PRIORIDADES, validarSolicitud } from '../../utils/format'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  serverError: {
    type: String,
    default: '',
  },
  serverSuccess: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['submit', 'cancel'])

const form = ref({
  titulo: '',
  descripcion: '',
  categoria: '',
  prioridad: 'Media',
})

const errores = ref({})

function onSubmit() {
  errores.value = validarSolicitud(form.value)
  if (Object.keys(errores.value).length > 0) {
    return
  }
  emit('submit', { ...form.value })
}

function resetForm() {
  form.value = {
    titulo: '',
    descripcion: '',
    categoria: '',
    prioridad: 'Media',
  }
  errores.value = {}
}

defineExpose({ resetForm, form, errores })
</script>

<template>
  <form class="request-form" @submit.prevent="onSubmit" novalidate>
    <div v-if="serverError" class="alerta error mb-4">
      <span class="alerta-icono">⚠️</span>
      <span>{{ serverError }}</span>
    </div>

    <div v-if="serverSuccess" class="alerta ok mb-4">
      <span class="alerta-icono">✓</span>
      <span>{{ serverSuccess }}</span>
    </div>

    <div class="form-group">
      <label for="campo-titulo" class="form-label">
        Título de la solicitud <span class="required">*</span>
      </label>
      <input
        id="campo-titulo"
        v-model="form.titulo"
        type="text"
        maxlength="120"
        placeholder="Ej: Solicitud de certificado laboral"
        class="form-input"
        :class="{ 'is-invalid': errores.titulo }"
        :disabled="loading"
      />
      <div class="field-meta">
        <span v-if="errores.titulo" class="error-msg">{{ errores.titulo }}</span>
        <span v-else class="hint-msg">Sé claro y conciso</span>
        <span class="char-count">{{ form.titulo.length }}/120</span>
      </div>
    </div>

    <div class="form-group">
      <label for="campo-descripcion" class="form-label">
        Descripción detallada <span class="required">*</span>
      </label>
      <textarea
        id="campo-descripcion"
        v-model="form.descripcion"
        rows="5"
        maxlength="2000"
        placeholder="Detalla tu requerimiento para que el sistema procese tu respuesta automáticamente..."
        class="form-textarea"
        :class="{ 'is-invalid': errores.descripcion }"
        :disabled="loading"
      ></textarea>
      <div class="field-meta">
        <span v-if="errores.descripcion" class="error-msg">{{ errores.descripcion }}</span>
        <span v-else class="hint-msg">Describe los detalles necesarios</span>
        <span class="char-count">{{ form.descripcion.length }}/2000</span>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="campo-categoria" class="form-label">
          Categoría <span class="required">*</span>
        </label>
        <select
          id="campo-categoria"
          v-model="form.categoria"
          class="form-select"
          :class="{ 'is-invalid': errores.categoria }"
          :disabled="loading"
        >
          <option value="" disabled>Selecciona una categoría</option>
          <option v-for="cat in CATEGORIAS" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
        <span v-if="errores.categoria" class="error-msg">{{ errores.categoria }}</span>
      </div>

      <div class="form-group">
        <label for="campo-prioridad" class="form-label">
          Prioridad <span class="required">*</span>
        </label>
        <select
          id="campo-prioridad"
          v-model="form.prioridad"
          class="form-select"
          :class="{ 'is-invalid': errores.prioridad }"
          :disabled="loading"
        >
          <option v-for="prio in PRIORIDADES" :key="prio" :value="prio">
            {{ prio }}
          </option>
        </select>
        <span v-if="errores.prioridad" class="error-msg">{{ errores.prioridad }}</span>
      </div>
    </div>

    <div class="form-actions">
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="loading"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="loading"
      >
        <span v-if="loading" class="spinner"></span>
        <span>{{ loading ? 'Enviando a la cola...' : 'Enviar Solicitud' }}</span>
      </button>
    </div>
  </form>
</template>

<style scoped>
.request-form {
  background: #ffffff;
  border-radius: 12px;
  padding: 28px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-label {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 14px;
  font-size: 0.95rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.form-input.is-invalid,
.form-textarea.is-invalid,
.form-select.is-invalid {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.field-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
  font-size: 0.78rem;
}

.error-msg {
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 500;
  display: block;
  margin-top: 4px;
}

.hint-msg {
  color: #94a3b8;
}

.char-count {
  color: #94a3b8;
  font-family: monospace;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 0.92rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}
.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-primary {
  background: #2563eb;
  color: white;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}
.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .request-form {
    padding: 20px 16px;
  }
  .form-actions {
    flex-direction: column-reverse;
  }
  .btn {
    width: 100%;
  }
}
</style>
