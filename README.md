# Garage Comics

This is a monorepo for the Garage Comics project, which includes a web application and an API.

## Tech Stack

- **Web app:** [Astro](https://astro.build/)
- **API:** [Go](https://go.dev/)
- **Package Manager:** [Bun](https://bun.sh/)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adrrian17/garage-comics.git
   cd garage-comics
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Run the development servers:**
   This will start both the web app and the API.
   ```bash
   bun run dev
   ```

## Available Scripts

### Root

- `bun run dev`: Starts the development servers for both the web app and the API.
- `bun run dev:web`: Starts the development server for the web app.
- `bun run dev:api`: Starts the development server for the API.

### Web App (`apps/web`)

- `bun run dev`: Starts the Astro development server.
- `bun run build`: Builds the Astro app for production.
- `bun run preview`: Previews the production build.
- `bun run astro`: Runs Astro CLI commands.
- `bun run lint`: Lints the codebase using Biome.
- `bun run lint:fix`: Fixes linting issues with Biome.

## Project Structure

The project is a monorepo using Bun workspaces.

- `apps/web`: Contains the Astro frontend application.
- `apps/api`: Contains the Go backend API.
- `packages/*`: Intended for shared packages between the apps.

## License

This project is licensed under the [MIT License](LICENSE).
