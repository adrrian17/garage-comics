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

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create tmp directory for temporary files
RUN mkdir -p tmp

# Create non-root user
RUN addgroup -g 1001 -S worker && \
    adduser -S worker -u 1001

# Change ownership of the working directory
RUN chown -R worker:worker /app

# Switch to non-root user
USER worker

# Expose port (not really needed for this worker, but good practice)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Worker is healthy')" || exit 1

# Start the worker (runs compiled JS from dist/)
CMD ["npm", "start"]