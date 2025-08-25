# Garage Comics Worker

Worker independiente para procesar pedidos desde RabbitMQ. Este worker:

1. 🎯 Escucha la cola "orders" de RabbitMQ
2. ⬇️ Descarga PDFs desde Cloudflare R2 usando los slugs de los productos
3. 🔄 Envía los PDFs a la API Go para procesamiento (watermarking)
4. ⬆️ Sube el ZIP procesado de vuelta a R2
5. ✅ Confirma el procesamiento del pedido

## Requisitos

- Node.js 18+
- Acceso a RabbitMQ
- Credenciales de Cloudflare R2
- API Go ejecutándose y accesible

## Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/

# Cloudflare R2
R2_ACCOUNT_ID=tu_account_id
R2_ACCESS_KEY_ID=tu_access_key_id  
R2_SECRET_ACCESS_KEY=tu_secret_access_key
R2_BUCKET_NAME=tu_bucket_name
R2_ENDPOINT=https://tu_account_id.r2.cloudflarestorage.com

# API Go
API_URL=http://api:1234
```

## Instalación y Uso

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo (con auto-reload)
npm run dev

# Ejecutar en modo producción
npm start
```

### Docker

```bash
# Construir imagen
docker build -t garage-comics-worker .

# Ejecutar contenedor
docker run -d \
  --name garage-comics-worker \
  --env-file .env \
  garage-comics-worker
```

### Docker Compose

El worker está incluido en el docker-compose.yml del proyecto raíz:

```bash
docker-compose up worker
```

## Estructura de Archivos

```
apps/worker/
├── src/
│   └── index.js          # Worker principal
├── tmp/                  # Archivos temporales (se crea automáticamente)
├── Dockerfile           # Configuración Docker
├── package.json         # Dependencias Node.js
├── .env.example         # Ejemplo de variables de entorno
└── README.md           # Esta documentación
```

## Funcionamiento

1. **Conexión**: Se conecta a RabbitMQ y escucha la cola "orders"
2. **Procesamiento**: Para cada mensaje:
   - Extrae los slugs de los productos del pedido
   - Descarga los PDFs correspondientes desde R2
   - Envía los PDFs a la API Go con email y orderId
   - Recibe el ZIP procesado de la API
   - Sube el ZIP a R2 en la carpeta `processed/`
   - Limpia archivos temporales
3. **ACK/NACK**: Confirma o rechaza el mensaje según el resultado

## Logs

El worker produce logs detallados para monitoreo:

- ✅ Éxito: Operaciones completadas correctamente
- ❌ Error: Fallos en el procesamiento
- ⚠️ Warning: Advertencias no críticas
- 🔄 Info: Estado general del procesamiento

## Manejo de Errores

- **Fallos temporales**: El mensaje se reencola automáticamente
- **Fallos permanentes**: El mensaje se rechaza (considera configurar una Dead Letter Queue)
- **Limpieza**: Los archivos temporales siempre se eliminan, incluso en caso de error

## Monitoreo

El worker incluye:

- Health checks para Docker
- Logs estructurados
- Manejo graceful de señales (SIGINT, SIGTERM)
- Limpieza automática de recursos

## Producción

Para producción, asegúrate de:

1. Configurar un sistema de logs (ej: Docker logging driver)
2. Implementar Dead Letter Queue en RabbitMQ
3. Monitorear el estado del worker
4. Configurar alertas para fallos
5. Backup de los archivos procesados en R2