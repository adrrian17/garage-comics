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
- **[Go](https://go.dev/)** - High-performance REST API
- **[Stripe API](https://stripe.com/docs/api)** - Payment integration

### Development Tools
- **[Bun](https://bun.sh/)** - Runtime and package manager
- **[Biome](https://biomejs.dev/)** - Linter and formatter
- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[TypeScript](https://www.typescriptlang.org/)** - Static typing

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
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
   bun install
   ```

3. **Configure environment variables:**
   ```bash
   cp apps/web/.env.example apps/web/.env
   # Edit apps/web/.env with your Stripe keys
   ```

4. **Start development servers:**
   ```bash
   bun run dev
   ```

   This will start:
   - 🌐 **Web App**: http://localhost:4321
   - 🔌 **API**: http://localhost:1234

## 📜 Available Scripts

### Root Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start both servers (web + API) |
| `bun run dev:web` | Start only the web server |
| `bun run dev:api` | Start only the API server |

### Web App (`apps/web`)

| Command | Description |
|---------|-------------|
| `bun run dev` | Astro development server |
| `bun run build` | Production build |
| `bun run preview` | Preview build |
| `bun run lint` | Run Biome linter |
| `bun run lint:fix` | Fix linting errors |

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
│   └── api/                    # Go API
│       └── main.go             # HTTP server
├── packages/                   # Shared packages (future)
└── node_modules/               # Dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `apps/web/` based on `.env.example`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Stripe Integration

The project uses Stripe for:
- Product and price management
- Payment processing
- Dynamic data loading with `stripe-astro-loader`

## 🧪 Development

### Linting and Formatting

The project uses Biome to maintain code quality:

```bash
# Check code
bun run lint

# Auto-fix issues
bun run lint:fix
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
bun run build
```

### API (Any Go Provider)

```bash
cd apps/api
go build -o main .
./main
```

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
- [Bun](https://bun.sh/) for development speed
