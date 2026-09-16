'use strict';

// Reglas de respuesta por categoría (doc §14 y taller §7)
const REGLAS = {
  Información:
    'Gracias por su solicitud de información. Nuestro horario de atención es de lunes a viernes, ' +
    'de 8:00 a. m. a 5:00 p. m. Puede consultar la sección de preguntas frecuentes en nuestro portal ' +
    'o escribir al correo info@taskflow.com para mayor detalle.',

  Soporte:
    'Hemos recibido su reporte de soporte. Sugerencias iniciales: verifique sus credenciales, ' +
    'borre la caché del navegador e intente nuevamente. Si el problema persiste, el equipo de ' +
    'soporte técnico lo contactará en un plazo máximo de 24 horas hábiles.',

  Documento:
    'Su solicitud de documento fue recibida. Para emitir el certificado requerimos: nombre completo, ' +
    'número de identificación y el tipo de documento solicitado. El trámite se realiza en un plazo de ' +
    '3 a 5 días hábiles y será notificado por correo electrónico.',

  Consulta:
    'Su solicitud de consulta fue registrada. El estado actual de su trámite se encuentra en ' +
    'revisión por el área responsable. Puede consultar el avance en cualquier momento desde la ' +
    'pantalla de detalle de su solicitud en TASKFLOW.',

  Actualización:
    'Su solicitud de actualización de datos fue recibida. El procedimiento consiste en diligenciar el ' +
    'formulario de actualización y adjuntar el soporte correspondiente. El cambio será aplicado y ' +
    'confirmado por el área encargada en un plazo de 2 días hábiles.',
};

const RESPUESTA_GENERICA =
  'Su solicitud fue recibida y registrada correctamente. Será revisada por el área correspondiente ' +
  'y recibirá una respuesta en los próximos días hábiles. Gracias por usar TASKFLOW.';

function generarRespuesta(categoria) {
  return REGLAS[categoria] || RESPUESTA_GENERICA;
}

module.exports = { REGLAS, RESPUESTA_GENERICA, generarRespuesta };
