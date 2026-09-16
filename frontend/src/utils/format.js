// Utilidades auxiliares (doc §3.11)

export function formatDate(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const CATEGORIAS = ['Información', 'Soporte', 'Documento', 'Consulta', 'Actualización']

export const PRIORIDADES = ['Baja', 'Media', 'Alta']

export const ESTADOS = ['PENDIENTE', 'EN_COLA', 'PROCESANDO', 'RESPONDIDA', 'ERROR']

// Validación del formulario de nueva solicitud (HU-01)
export function validarSolicitud(form) {
  const errores = {}
  if (!form.titulo || !form.titulo.trim()) {
    errores.titulo = 'El título es obligatorio.'
  } else if (form.titulo.trim().length > 120) {
    errores.titulo = 'Máximo 120 caracteres.'
  }
  if (!form.descripcion || !form.descripcion.trim()) {
    errores.descripcion = 'La descripción es obligatoria.'
  } else if (form.descripcion.trim().length > 2000) {
    errores.descripcion = 'Máximo 2000 caracteres.'
  }
  if (!CATEGORIAS.includes(form.categoria)) {
    errores.categoria = 'Selecciona una categoría.'
  }
  if (!PRIORIDADES.includes(form.prioridad)) {
    errores.prioridad = 'Selecciona una prioridad.'
  }
  return errores
}
