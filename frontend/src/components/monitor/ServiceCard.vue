<script setup>
// Tarjeta de estado y salud de servicio de infraestructura (doc §3.2, §10, HU-09)
defineProps({
  nombre: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    default: '',
  },
  icono: {
    type: String,
    default: '⚙️',
  },
  disponible: {
    type: Boolean,
    default: null,
  },
  detalles: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div
    class="service-card"
    :class="{
      'is-online': disponible === true,
      'is-offline': disponible === false,
      'is-unknown': disponible === null,
    }"
  >
    <div class="card-header">
      <div class="service-icon">{{ icono }}</div>
      <div class="service-info">
        <h4>{{ nombre }}</h4>
        <p class="service-desc">{{ descripcion }}</p>
      </div>
      <div class="status-indicator">
        <span class="status-dot"></span>
        <span class="status-text">
          {{ disponible === true ? 'En línea' : disponible === false ? 'No disponible' : 'Desconocido' }}
        </span>
      </div>
    </div>

    <div v-if="detalles && Object.keys(detalles).length > 0" class="card-body">
      <div v-for="(valor, clave) in detalles" :key="clave" class="detail-row">
        <span class="detail-key">{{ clave }}:</span>
        <span class="detail-val">{{ valor }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.service-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.service-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
}

.service-info {
  flex: 1;
}

.service-info h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.service-desc {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 2px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* En línea */
.service-card.is-online {
  border-color: #bbf7d0;
}
.service-card.is-online .status-indicator {
  background: #f0fdf4;
  color: #15803d;
}
.service-card.is-online .status-dot {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}
.service-card.is-online .service-icon {
  background: #f0fdf4;
}

/* Fuera de línea */
.service-card.is-offline {
  border-color: #fecaca;
  background: #fffafa;
}
.service-card.is-offline .status-indicator {
  background: #fef2f2;
  color: #b91c1c;
}
.service-card.is-offline .status-dot {
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
}
.service-card.is-offline .service-icon {
  background: #fef2f2;
}

/* Desconocido */
.service-card.is-unknown .status-indicator {
  background: #f1f5f9;
  color: #64748b;
}
.service-card.is-unknown .status-dot {
  background: #94a3b8;
}

.card-body {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  color: #475569;
}

.detail-key {
  color: #94a3b8;
  text-transform: capitalize;
}

.detail-val {
  font-weight: 500;
  font-family: monospace;
}
</style>
