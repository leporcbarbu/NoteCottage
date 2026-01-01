# Use official Node.js LTS (Long Term Support) image as base
# Alpine = lightweight Linux distribution (smaller image size)
FROM node:20-alpine

# Set working directory inside container
# All subsequent commands run from this directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
# If package.json hasn't changed, Docker reuses the npm install layer
COPY package*.json ./

# Install dependencies inside the container
# --production flag skips devDependencies (lighter image)
# Remove --production if you want to run tests inside container
RUN npm install --production

# Copy application source code
# .dockerignore determines what gets excluded
COPY . .

# Copy and set permissions for entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create directories for database and uploads with proper permissions
RUN mkdir -p /app/data /app/uploads && chown -R node:node /app/data /app/uploads

# Switch to non-root user for security
# Running as root inside containers is a security risk
USER node

# Expose port 3000 (informational - doesn't actually open the port)
# Docker Compose will map this to host port
EXPOSE 3000

# Set environment variables
# Can be overridden by docker-compose.yml or docker run
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/notecottage.db

# Entrypoint script that checks permissions before starting
ENTRYPOINT ["docker-entrypoint.sh"]
