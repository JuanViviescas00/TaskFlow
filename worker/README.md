# TASKFLOW — Worker

Servicio independiente para el **procesamiento asíncrono de solicitudes** desde Redis Queue (taller §14 y `Doc/ARQUITECTURA_TASKFLOW.md`).

## Responsabilidades
1. Consumir solicitudes encoladas en Redis (`cola:solicitudes`).
2. Consultar la solicitud en MongoDB y cambiar su estado a `PROCESANDO`.
3. Aplicar las reglas de respuesta automáticas según la categoría (`Información`, `Soporte`, `Documento`, `Consulta`, `Actualización`).
4. Persistir la respuesta y la fecha de procesamiento en MongoDB y cambiar el estado a `RESPONDIDA`.
5. Manejar errores de procesamiento de forma controlada pasando el estado a `ERROR` sin detener el servicio.
6. Notificar los eventos en tiempo real al backend mediante Socket.IO (`worker:suscribir`, `worker:heartbeat`, etc.).

## Estructura
```
worker/
├── Dockerfile           # Imagen Node.js alpine independiente
├── package.json         # Dependencias mínimas (ioredis, mongoose, socket.io-client, dotenv)
├── .env.example         # Variables de entorno requeridas
└── src/
    ├── index.js         # Bucle principal de consumo y orquestación
    ├── config/          # Conexiones a MongoDB, Redis y variables de entorno
    ├── models/          # Modelo Mongoose Solicitud
    ├── services/        # Consumo de cola y gestión de caché
    └── utils/           # Reglas de respuesta predefinidas y constantes
```

## Ejecución Local
```bash
cd worker
npm install
npm start
```
