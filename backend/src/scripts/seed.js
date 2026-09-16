'use strict';

require('dotenv').config();

const { conectarMongo, desconectarMongo } = require('../config/mongo');
const { crearClienteRedis } = require('../config/redis');
const Solicitud = require('../models/Solicitud');
const { ESTADOS, CATEGORIAS, PRIORIDADES, CACHE_PREFIX } = require('../utils/constantes');
const { generarRespuesta } = require('../utils/reglasRespuesta');

// Datos de ejemplo para demostraciones (opcional).
// Uso: npm run seed [-- --limpiar]

const EJEMPLOS = [
  {
    titulo: '¿Cuál es el horario de atención?',
    descripcion: 'Necesito conocer los horarios de atención al público de la oficina principal.',
    categoria: CATEGORIAS[0],
    prioridad: PRIORIDADES[0],
  },
  {
    titulo: 'No puedo acceder al sistema',
    descripcion: 'Desde ayer mi usuario no inicia sesión, aparece error de credenciales.',
    categoria: CATEGORIAS[1],
    prioridad: PRIORIDADES[2],
  },
  {
    titulo: 'Solicitud de certificado laboral',
    descripcion: 'Requiero el certificado laboral para trámites bancarios.',
    categoria: CATEGORIAS[2],
    prioridad: PRIORIDADES[1],
  },
  {
    titulo: 'Estado de mi trámite #1042',
    descripcion: 'Quisiera saber en qué estado se encuentra mi trámite enviado la semana pasada.',
    categoria: CATEGORIAS[3],
    prioridad: PRIORIDADES[0],
  },
  {
    titulo: 'Actualizar correo de contacto',
    descripcion: 'Cambió mi correo personal, necesito actualizarlo en el sistema.',
    categoria: CATEGORIAS[4],
    prioridad: PRIORIDADES[1],
  },
];

async function limpiarColecciones() {
  await Solicitud.deleteMany({});
  const redis = crearClienteRedis('seed');
  await redis.del('cola:solicitudes');
  const claves = await redis.keys('cache:*');
  if (claves.length > 0) {
    await redis.del(...claves);
  }
  await redis.quit().catch(() => redis.disconnect());
  console.log('[seed] Colecciones, cola y caché limpiadas.');
}

async function main() {
  const limpiar = process.argv.includes('--limpiar');
  await conectarMongo();

  if (limpiar) {
    await limpiarColecciones();
  }

  const existentes = await Solicitud.countDocuments({});
  if (existentes > 0 && !limpiar) {
    console.log(`[seed] Ya existen ${existentes} solicitudes. Use --limpiar para reiniciar.`);
    await desconectarMongo();
    return;
  }

  const ahora = Date.now();
  const documentos = EJEMPLOS.map((ejemplo, indice) => {
    const respondida = indice % 2 === 0; // alternar respondidas / en cola
    const fechaCreacion = new Date(ahora - (EJEMPLOS.length - indice) * 3600_000);
    return {
      ...ejemplo,
      estado: respondida ? ESTADOS.RESPONDIDA : ESTADOS.EN_COLA,
      respuesta: respondida ? generarRespuesta(ejemplo.categoria) : null,
      fechaProcesamiento: respondida ? new Date(fechaCreacion.getTime() + 120_000) : null,
      fechaCreacion,
    };
  });

  const creadas = await Solicitud.insertMany(documentos);

  // Las "EN_COLA" deben quedar realmente en la cola de Redis
  const redis = crearClienteRedis('seed');
  for (const s of creadas.filter((d) => d.estado === ESTADOS.EN_COLA)) {
    await redis.lpush('cola:solicitudes', s._id.toString());
  }
  await redis.quit().catch(() => redis.disconnect());

  console.log(`[seed] ${creadas.length} solicitudes de ejemplo creadas.`);
  console.log('[seed] Listo para demostrar: listado, caché, cola y worker.');
  await desconectarMongo();
}

main().catch((err) => {
  console.error('[seed] Error:', err.message);
  process.exit(1);
});
