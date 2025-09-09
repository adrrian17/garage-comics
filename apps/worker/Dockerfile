# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy TypeScript source code and config
COPY src/ ./src/
COPY tsconfig.json ./
COPY wait-for-rabbit.sh ./

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create tmp directory for temporary files (before user creation)
RUN mkdir -p tmp

# Change ownership of the working directory including tmp
RUN chown -R worker:worker /app

# Ensure tmp directory has write permissions
RUN chmod 755 /app/tmp

# Switch to non-root user
USER worker

# Expose port (not really needed for this worker, but good practice)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Worker is healthy')" || exit 1

# Asegurar permisos para el script
RUN chmod +x wait-for-rabbit.sh

# Ejecutar script que espera a RabbitMQ antes de levantar la app
CMD ["sh", "./wait-for-rabbit.sh"]