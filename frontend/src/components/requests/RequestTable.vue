<script setup>
// Componente de tabla y tarjetas de solicitudes (doc §3.2, §10, HU-02, HU-14)
import EstadoBadge from '../EstadoBadge.vue'
import { formatDate } from '../../utils/format'

defineProps({
  solicitudes: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['eliminar'])
</script>

<template>
  <div class="table-wrapper">
    <div v-if="loading" class="table-loading">
      <div class="loader-spinner"></div>
      <p>Cargando información de solicitudes...</p>
    </div>

    <div v-else-if="solicitudes.length === 0" class="table-empty">
      <span class="empty-icon">📭</span>
      <h3>No se encontraron solicitudes</h3>
      <p>No hay solicitudes que coincidan con los criterios seleccionados o aún no has registrado ninguna.</p>
      <RouterLink to="/solicitudes/nueva" class="btn-create">
        ➕ Crear primera solicitud
      </RouterLink>
    </div>

    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-id">ID</th>
            <th class="col-title">Título / Asunto</th>
            <th class="col-cat">Categoría</th>
            <th class="col-prio">Prioridad</th>
            <th class="col-status">Estado</th>
            <th class="col-date">Fecha de Registro</th>
            <th class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in solicitudes" :key="s.id" class="table-row">
            <td class="col-id">
              <span class="id-tag" :title="s.id">#{{ s.id ? s.id.slice(-6) : '' }}</span>
            </td>
            <td class="col-title">
              <RouterLink :to="`/solicitudes/${s.id}`" class="item-link">
                <strong>{{ s.titulo }}</strong>
              </RouterLink>
              <p class="desc-preview">{{ s.descripcion }}</p>
            </td>
            <td class="col-cat">
              <span class="cat-pill">{{ s.categoria }}</span>
            </td>
            <td class="col-prio">
              <span
                class="prio-tag"
                :class="'prio-' + (s.prioridad ? s.prioridad.toLowerCase() : 'media')"
              >
                {{ s.prioridad }}
              </span>
            </td>
            <td class="col-status">
              <EstadoBadge :estado="s.estado" />
            </td>
            <td class="col-date">
              <span class="date-text">{{ formatDate(s.fechaCreacion) }}</span>
            </td>
            <td class="col-actions">
              <div class="actions-group">
                <RouterLink
                  :to="`/solicitudes/${s.id}`"
                  class="action-btn view-btn"
                  title="Ver detalle y respuesta"
                >
                  Ver
                </RouterLink>
                <button
                  type="button"
                  class="action-btn delete-btn"
                  title="Eliminar solicitud"
                  @click="emit('eliminar', s)"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-wrapper {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.table-loading,
.table-empty {
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.table-loading p {
  color: #64748b;
  font-size: 0.95rem;
}

.loader-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-icon {
  font-size: 3rem;
  line-height: 1;
}

.table-empty h3 {
  font-size: 1.15rem;
  color: #1e293b;
}

.table-empty p {
  color: #64748b;
  font-size: 0.9rem;
  max-width: 420px;
}

.btn-create {
  margin-top: 8px;
  background: #2563eb;
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  background: #f8fafc;
  padding: 14px 18px;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 16px 18px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  font-size: 0.9rem;
}

.table-row:hover {
  background: #f8fafc;
}

.id-tag {
  font-family: monospace;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 6px;
  border-radius: 4px;
}

.item-link {
  color: #0f172a;
  text-decoration: none;
  font-weight: 600;
  display: block;
}

.item-link:hover {
  color: #2563eb;
}

.desc-preview {
  color: #64748b;
  font-size: 0.8rem;
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 300px;
}

.cat-pill {
  display: inline-block;
  background: #f1f5f9;
  color: #334155;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.prio-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
}
.prio-alta {
  background: #fef2f2;
  color: #b91c1c;
}
.prio-media {
  background: #fffbeb;
  color: #b45309;
}
.prio-baja {
  background: #f0fdf4;
  color: #15803d;
}

.date-text {
  color: #64748b;
  font-size: 0.84rem;
  white-space: nowrap;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.action-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.view-btn {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}
.view-btn:hover {
  background: #dbeafe;
}

.delete-btn {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}
.delete-btn:hover {
  background: #fee2e2;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
