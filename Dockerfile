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

# Create directory for database with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

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

# Command to run when container starts
# Uses JSON array syntax (preferred over string)
CMD ["node", "server.js"]
