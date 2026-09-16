import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

export function useToast() {
  function addToast({ title, message, type = 'info', duration = 4000 }) {
    const id = ++toastId
    toasts.value.push({ id, title, message, type })

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    return id
  }

  function removeToast(id) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function success(message, title = 'Éxito') {
    return addToast({ title, message, type: 'success' })
  }

  function error(message, title = 'Error') {
    return addToast({ title, message, type: 'error' })
  }

  function info(message, title = 'Notificación') {
    return addToast({ title, message, type: 'info' })
  }

  function warning(message, title = 'Atención') {
    return addToast({ title, message, type: 'warning' })
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }
}
