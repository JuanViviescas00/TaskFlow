<script setup>
// Panel de respuesta generada o mensaje de error (doc §3.2, §10, HU-03, HU-06, HU-11)
defineProps({
  estado: {
    type: String,
    required: true,
  },
  respuesta: {
    type: String,
    default: null,
  },
  mensajeError: {
    type: String,
    default: null,
  },
  fechaProcesamiento: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <div class="response-container">
    <!-- Estado: RESPONDIDA -->
    <div v-if="estado === 'RESPONDIDA' && respuesta" class="panel-box response-success">
      <div class="box-header">
        <div class="header-icon success-icon">✓</div>
        <div>
          <h4>Respuesta Generada Automáticamente</h4>
          <p class="subtitle">Atendida según las reglas de categorización del sistema</p>
        </div>
      </div>
      <div class="box-content">
        <p class="response-text">{{ respuesta }}</p>
      </div>
    </div>

    <!-- Estado: ERROR -->
    <div v-else-if="estado === 'ERROR' || mensajeError" class="panel-box response-error">
      <div class="box-header">
        <div class="header-icon error-icon">⚠️</div>
        <div>
          <h4>Error durante el Procesamiento</h4>
          <p class="subtitle">Ocurrió una incidencia controlada en el Worker</p>
        </div>
      </div>
      <div class="box-content">
        <p class="error-text">{{ mensajeError || 'No se pudo procesar la solicitud en este momento.' }}</p>
      </div>
    </div>

    <!-- Estado: PROCESANDO -->
    <div v-else-if="estado === 'PROCESANDO'" class="panel-box response-processing">
      <div class="box-header">
        <div class="header-icon processing-icon">
          <div class="spin-ring"></div>
        </div>
        <div>
          <h4>Procesando Solicitud...</h4>
          <p class="subtitle">El Worker Node.js está evaluando las reglas para generar la respuesta</p>
        </div>
      </div>
      <div class="box-content">
        <p class="wait-text">Los cambios de estado se actualizarán automáticamente en pantalla en tiempo real sin recargar.</p>
      </div>
    </div>

    <!-- Estado: EN COLA o PENDIENTE -->
    <div v-else class="panel-box response-waiting">
      <div class="box-header">
        <div class="header-icon waiting-icon">⏳</div>
        <div>
          <h4>En cola de espera (Redis)</h4>
          <p class="subtitle">La solicitud está aguardando un Worker disponible para su procesamiento</p>
        </div>
      </div>
      <div class="box-content">
        <p class="wait-text">
          La solicitud se encuentra almacenada en MongoDB y encolada en Redis (<code>cola:solicitudes</code>).
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-box {
  border-radius: 12px;
  padding: 22px;
  margin-top: 20px;
  border: 1px solid;
  transition: all 0.3s ease;
}

.box-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: bold;
}

.box-header h4 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.subtitle {
  font-size: 0.78rem;
  color: #64748b;
}

.box-content {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* Éxito / Respondida */
.response-success {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.response-success .box-header h4 {
  color: #15803d;
}
.success-icon {
  background: #22c55e;
  color: white;
  box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3);
}
.response-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #1e293b;
  white-space: pre-wrap;
}

/* Error */
.response-error {
  background: #fef2f2;
  border-color: #fecaca;
}
.response-error .box-header h4 {
  color: #b91c1c;
}
.error-icon {
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}
.error-text {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #991b1b;
}

/* Procesando */
.response-processing {
  background: #faf5ff;
  border-color: #e9d5ff;
}
.response-processing .box-header h4 {
  color: #7e22ce;
}
.processing-icon {
  background: #a855f7;
  color: white;
}
.spin-ring {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* En cola / Pendiente */
.response-waiting {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.response-waiting .box-header h4 {
  color: #1d4ed8;
}
.waiting-icon {
  background: #3b82f6;
  color: white;
}

.wait-text {
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.5;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
