# 🎨 Garage Comics

This is a monorepo for the Garage Comics project, which includes a web application and an API.

## 🛠️ Tech Stack

### Frontend
- **[Astro](https://astro.build/)** - Modern web framework with SSG
- **[React](https://react.dev/)** - Interactive components
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management
- **[Stripe](https://stripe.com/)** - Payment processing
- **[Radix UI](https://www.radix-ui.com/)** - Accessible components

### Backend
- **[Go](https://go.dev/)** - High-performance REST API for PDF watermarking
- **[pdfcpu](https://github.com/pdfcpu/pdfcpu)** - PDF processing and watermark application
- **[Stripe API](https://stripe.com/docs/api)** - Payment integration
- **[Node.js Worker](https://nodejs.org/)** - Background order processing with RabbitMQ
- **[RabbitMQ](https://www.rabbitmq.com/)** - Message queue for order processing
- **[Cloudflare R2](https://developers.cloudflare.com/r2/)** - File storage and signed URLs

### Development Tools
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[Biome](https://biomejs.dev/)** - Linter and formatter
- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[TypeScript](https://www.typescriptlang.org/)** - Static typing

## 🚀 Quick Start

### Prerequisites

- [pnpm](https://pnpm.io/) >= 8.0
- [Go](https://go.dev/) >= 1.21
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adrrian17/garage-comics.git
   cd garage-comics
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   ```bash
   cp apps/web/.env.example apps/web/.env
   # Edit apps/web/.env with your Stripe keys
   ```

4. **Start development servers:**
   ```bash
   pnpm run dev
   ```

   This will start:
   - 🌐 **Web App**: http://localhost:4321
   - 🔌 **PDF Watermark API**: http://localhost:1234
   - 📨 **Worker**: Background order processing (requires RabbitMQ)

## 📜 Available Scripts

### Root Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start all services (web + API + worker) |
| `pnpm run dev:web` | Start only the web server |
| `pnpm run dev:api` | Start only the API server |
| `pnpm run dev:worker` | Start only the worker |

### Web App (`apps/web`)

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Astro development server |
| `pnpm run build` | Production build |
| `pnpm run preview` | Preview build |
| `pnpm run lint` | Run Biome linter |
| `pnpm run lint:fix` | Fix linting errors |

## 📁 Project Structure

```
garage-comics/
├── apps/
│   ├── web/                    # Astro application
│   │   ├── src/
│   │   │   ├── components/     # React/Astro components
│   │   │   ├── content/        # Content and configuration
│   │   │   ├── pages/          # Application routes
│   │   │   ├── stores/         # Global state (Zustand)
│   │   │   └── styles/         # Global styles
│   │   └── public/             # Static assets
│   ├── api/                    # Go PDF Watermark API
│   │   ├── main.go             # HTTP server with watermark endpoints
│   │   └── README.md           # API documentation
│   └── worker/                 # Node.js Background Worker
│       ├── src/                # Worker source code
│       ├── templates/          # Email templates
│       ├── Dockerfile          # Docker configuration
│       └── README.md           # Worker documentation
├── packages/                   # Shared packages (future)
└── node_modules/               # Dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `apps/web/` based on `.env.example`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application Configuration
PUBLIC_COUNTDOWN_DATE=2025-08-30T11:59:59

# Worker Configuration (apps/worker/.env)
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
API_URL=http://api:1234
```

#### Variable Descriptions

| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key for server-side operations | ✅ |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for client-side operations | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint secret for verifying Stripe events | ✅ |
| `PUBLIC_COUNTDOWN_DATE` | Public countdown date for the application | ✅ |
| `RABBITMQ_URL` | RabbitMQ connection URL for worker | ✅ (worker) |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID for file storage | ✅ (worker) |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key for authentication | ✅ (worker) |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key for authentication | ✅ (worker) |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket name for file storage | ✅ (worker) |
| `R2_ENDPOINT` | Cloudflare R2 endpoint URL | ✅ (worker) |
| `API_URL` | Go API URL for PDF processing | ✅ (worker) |

### Stripe Integration

The project uses Stripe for:
- Product and price management
- Payment processing
- Dynamic data loading with `stripe-astro-loader`
- Webhook handling for payment events

#### Setting up Stripe Webhooks Locally

To test Stripe webhooks in your local development environment:

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server:**
   ```bash
   stripe listen --forward-to localhost:4321/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret:**
   The Stripe CLI will display a webhook signing secret (starts with `whsec_`). Copy this value and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

5. **Test the webhook:**
   ```bash
   # In another terminal, trigger a test event
   stripe trigger payment_intent.succeeded
   ```

#### Supported Webhook Events

The webhook endpoint handles the following Stripe events:

- `payment_intent.succeeded` - Processes successful payments and creates transfers to connected accounts
- `account.updated` - Configures payout settings for verified connected accounts
- `payout.paid` - Logs successful payout processing
- `payout.failed` - Logs failed payout attempts

#### Webhook URL

- **Local Development**: `http://localhost:4321/api/webhooks/stripe`
- **Production**: `https://yourdomain.com/api/webhooks/stripe`

## 🧪 Development

### Linting and Formatting

The project uses Biome to maintain code quality:

```bash
# Check code
pnpm run lint

# Auto-fix issues
pnpm run lint:fix
```

### Git Hooks

Husky is configured to run linting before each commit:

```bash
# Hooks are installed automatically after bun install
# Configured in .husky/pre-commit
```

### Component Structure

- **Astro Components** (`.astro`): For static content and SSG
- **React Components** (`.tsx`): For client-side interactivity
- **UI Components**: Based on shadcn/ui

## 🚀 Deployment

### Web App (Vercel)

The project is configured for Vercel deployment:

```bash
pnpm run build
```

### API (Any Go Provider)

The Go API provides PDF watermarking functionality:

```bash
cd apps/api
go build -o main .
./main
```

See `apps/api/README.md` for detailed API documentation, endpoints, and usage examples.

### Worker (Docker/Node.js)

The background worker processes orders from RabbitMQ:

```bash
# Local development
cd apps/worker
npm install
npm run dev

# Docker
docker-compose up worker
```

The worker handles:
- 📨 Order processing from RabbitMQ queue
- ⬇️ PDF downloads from Cloudflare R2
- 🔄 PDF watermarking via Go API
- ⬆️ Processed file uploads to R2
- 🔗 Signed URL generation (24h expiry)

See `apps/worker/README.md` for detailed worker documentation and configuration.

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

### Code Standards

- Use Biome for formatting and linting
- Follow TypeScript conventions
- Document complex components
- Write descriptive commits

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Astro](https://astro.build/) for the amazing framework
- [Stripe](https://stripe.com/) for payment integration
- [Tailwind CSS](https://tailwindcss.com/) for the design system
- [pnpm](https://pnpm.io/) for fast and efficient package management
