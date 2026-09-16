<script setup>
// Panel de estadísticas de la cola Redis y estado de procesamiento (HU-04, HU-09)
defineProps({
  cola: {
    type: Number,
    default: 0,
  },
  pendientes: {
    type: Number,
    default: 0,
  },
  procesando: {
    type: Number,
    default: 0,
  },
  respondidas: {
    type: Number,
    default: 0,
  },
  errores: {
    type: Number,
    default: 0,
  },
  eventosRecibidos: {
    type: Number,
    default: 0,
  },
})
</script>

<template>
  <div class="queue-panel">
    <div class="panel-header">
      <div class="title-with-icon">
        <span class="header-emoji">⚡</span>
        <div>
          <h3>Estado de la Cola y Flujo Asíncrono</h3>
          <p class="panel-sub">Monitoreo de la cola Redis <code>cola:solicitudes</code></p>
        </div>
      </div>
      <div class="events-badge" title="Eventos recibidos por Socket.IO">
        <span>Eventos Socket:</span>
        <strong>{{ eventosRecibidos }}</strong>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-item cola-item">
        <span class="metric-label">En Cola (Redis)</span>
        <span class="metric-number">{{ cola }}</span>
        <span class="metric-desc">Esperando Worker</span>
      </div>

      <div class="metric-item proc-item">
        <span class="metric-label">En Proceso</span>
        <span class="metric-number">{{ procesando }}</span>
        <span class="metric-desc">Worker trabajando</span>
      </div>

      <div class="metric-item resp-item">
        <span class="metric-label">Respondidas</span>
        <span class="metric-number">{{ respondidas }}</span>
        <span class="metric-desc">Procesadas con éxito</span>
      </div>

      <div class="metric-item err-item">
        <span class="metric-label">Con Error</span>
        <span class="metric-number">{{ errores }}</span>
        <span class="metric-desc">Fallas controladas</span>
      </div>
    </div>

    <div class="flow-explanation">
      <span class="flow-badge">Flujo:</span>
      <span class="flow-step">1. Registro en MongoDB</span>
      <span class="flow-arrow">→</span>
      <span class="flow-step">2. Encolado en Redis</span>
      <span class="flow-arrow">→</span>
      <span class="flow-step">3. Worker procesa</span>
      <span class="flow-arrow">→</span>
      <span class="flow-step">4. Respuesta en Vue 3</span>
    </div>
  </div>
</template>

<style scoped>
.queue-panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-emoji {
  font-size: 1.6rem;
}

.title-with-icon h3 {
  font-size: 1.1rem;
  color: #0f172a;
  font-weight: 700;
}

.panel-sub {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 2px;
}

.panel-sub code {
  background: #f1f5f9;
  padding: 2px 5px;
  border-radius: 4px;
  font-family: monospace;
}

.events-badge {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.metric-item {
  padding: 16px;
  border-radius: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cola-item {
  background: #eff6ff;
  border: 1px solid #dbeafe;
  color: #1d4ed8;
}
.proc-item {
  background: #faf5ff;
  border: 1px solid #f3e8ff;
  color: #7e22ce;
}
.resp-item {
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  color: #15803d;
}
.err-item {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #b91c1c;
}

.metric-label {
  font-size: 0.76rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-number {
  font-size: 1.8rem;
  font-weight: 800;
}

.metric-desc {
  font-size: 0.72rem;
  opacity: 0.85;
}

.flow-explanation {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #475569;
}

.flow-badge {
  font-weight: 700;
  color: #0f172a;
}

.flow-step {
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  font-weight: 500;
}

.flow-arrow {
  color: #94a3b8;
  font-weight: bold;
}
</style>
