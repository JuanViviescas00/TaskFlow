<script setup>
// Indicador visual de CACHE HIT / CACHE MISS (HU-08)
// Diseñado para evidenciar pedagógicamente si la consulta fue atendida por Redis o MongoDB.
defineProps({
  cache: {
    type: String,
    default: 'MISS',
  },
  showLabel: {
    type: Boolean,
    default: true,
  },
  clickable: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['click'])
</script>

<template>
  <div
    class="cache-badge"
    :class="[cache === 'HIT' ? 'hit' : 'miss', { 'is-clickable': clickable }]"
    :title="clickable ? 'Haz clic para inspeccionar y probar la caché' : ''"
    @click="$emit('click', $event)"
  >
    <span class="cache-icon">{{ cache === 'HIT' ? '⚡' : '💾' }}</span>
    <span class="cache-text">
      <strong>{{ cache === 'HIT' ? 'CACHE HIT' : 'CACHE MISS' }}</strong>
      <span v-if="showLabel" class="cache-source">
        ({{ cache === 'HIT' ? 'Redis' : 'MongoDB' }})
      </span>
    </span>
    <span v-if="clickable" class="badge-hint">🔍</span>
  </div>
</template>

<style scoped>
.cache-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.2s ease;
  user-select: none;
}

.cache-badge.hit {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  box-shadow: 0 1px 3px rgba(16, 185, 129, 0.15);
}

.cache-badge.miss {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.cache-badge.is-clickable {
  cursor: pointer;
}

.cache-badge.is-clickable:hover {
  transform: translateY(-1px);
  filter: brightness(0.96);
  box-shadow: 0 3px 6px -1px rgba(0, 0, 0, 0.1);
}

.badge-hint {
  font-size: 0.72rem;
  opacity: 0.6;
  margin-left: 2px;
}

.cache-icon {
  font-size: 0.9rem;
}

.cache-source {
  font-size: 0.72rem;
  opacity: 0.85;
  margin-left: 2px;
}
</style>
