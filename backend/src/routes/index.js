'use strict';

const { Router } = require('express');
const controller = require('../controllers/solicitud.controller');

// Rutas de la API (doc §5)
const router = Router();

router.get('/solicitudes', controller.listar);
router.get('/solicitudes/:id', controller.obtener);
router.post('/solicitudes', controller.crear);
router.put('/solicitudes/:id', controller.actualizar);
router.delete('/solicitudes/:id', controller.eliminar);

router.get('/estadisticas', controller.estadisticas);
router.get('/monitor', controller.monitor);

module.exports = router;
