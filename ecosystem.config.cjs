// ==============================================================================
// TASKFLOW - Configuración de PM2 para Render (Contenedor Unificado)
// Gestiona el proceso del Backend API y del Worker en paralelo
// ==============================================================================

module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'backend/src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '220M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'worker',
      script: 'worker/src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '180M',
      env: {
        NODE_ENV: 'production',
        BACKEND_URL_PARA_WORKER:
          process.env.BACKEND_URL_PARA_WORKER ||
          `http://127.0.0.1:${process.env.PORT || 3000}`,
      },
    },
  ],
};
