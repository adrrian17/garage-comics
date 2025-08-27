# Garage Comics Worker

Independent worker to process orders from RabbitMQ. This worker:

1. 🎯 Listens to the "orders" queue from RabbitMQ
2. ⬇️ Downloads PDFs from Cloudflare R2 using product slugs
3. 🔄 Sends PDFs to the Go API for processing (watermarking)
4. ⬆️ Uploads the processed ZIP back to R2
5. 🔗 Generates signed URLs that expire in 24 hours
6. ✅ Confirms order processing

## Requirements

- Node.js 18+
- RabbitMQ access
- Cloudflare R2 credentials
- Go API running and accessible

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id  
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com

# Go API
API_URL=http://api:1234
```

## Installation and Usage

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Run in production mode
npm start
```

### Docker

```bash
# Build image
docker build -t garage-comics-worker .

# Run container
docker run -d \
  --name garage-comics-worker \
  --env-file .env \
  garage-comics-worker
```

### Docker Compose

The worker is included in the root project's docker-compose.yml:

```bash
docker-compose up worker
```

## File Structure

```
apps/worker/
├── src/
│   └── index.ts        # Main worker
├── templates/          # Email templates
├── tmp/                # Temporary files (auto-created)
├── Dockerfile          # Docker configuration
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables example
└── README.md           # This documentation
```

## How It Works

1. **Connection**: Connects to RabbitMQ and listens to the "orders" queue
2. **Processing**: For each message:
   - Extracts product slugs from the order
   - Downloads corresponding PDFs from R2
   - Sends PDFs to Go API with email and orderId
   - Receives the processed ZIP from the API
   - Uploads the ZIP to R2 in the `processed/` folder
   - Cleans up temporary files
3. **ACK/NACK**: Acknowledges or rejects the message based on the result

## Logs

The worker produces detailed logs for monitoring:

- ✅ Success: Operations completed correctly
- ❌ Error: Processing failures
- ⚠️ Warning: Non-critical warnings
- 🔄 Info: General processing status

## Error Handling

- **Temporary failures**: Message is automatically requeued
- **Permanent failures**: Message is rejected (consider configuring a Dead Letter Queue)
- **Cleanup**: Temporary files are always deleted, even on error

## Monitoring

The worker includes:

- Docker health checks
- Structured logs
- Graceful signal handling (SIGINT, SIGTERM)
- Automatic resource cleanup

## Signed URLs Features

- **Secure**: No authentication required for downloads
- **Time-limited**: Expire exactly 24 hours after generation
- **Direct download**: Work in browsers, curl, wget, etc.
- **Automatic**: Generated after each successful upload

## Production

For production, make sure to:

1. Configure a logging system (e.g., Docker logging driver)
2. Implement Dead Letter Queue in RabbitMQ
3. Monitor worker status
4. Configure failure alerts
5. Backup processed files in R2
6. **Monitor expiration** of signed URLs in logs