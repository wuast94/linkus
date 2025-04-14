# Stage 1: Build the SvelteKit application
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# Use ci for consistent installs, install ALL dependencies for build step
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the SvelteKit application
# This might implicitly use .env files, but we override ORIGIN/HOSTS at runtime
RUN npm run build

# Remove development dependencies AFTER build
RUN npm prune --production

# Stage 2: Create the final production image
FROM node:22-alpine
WORKDIR /app

ARG VERSION=0
ENV VERSION=$VERSION
# Set default environment variables for the runtime stage
# These can be overridden using 'docker run -e VAR=value ...'
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
# IMPORTANT: Set ORIGIN to the public URL the app is accessed from!
ENV ORIGIN='http://localhost:3000'
# Remove ALLOWED_HOSTS as it's not used by adapter-node production server
# ENV ALLOWED_HOSTS="localhost,127.0.0.1"

# Copy the example config from the root of the build context
COPY config.example.yaml /app/config.example.yaml

# Copy essential files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/build build/

# Remove command to create user/group, as 'node' already exists in the base image
# Alpine's node image often includes 'node', but we ensure it exists and owns the app dir
# RUN addgroup -S node && adduser -S node -G node

# Change ownership of the app directory to the existing 'node' user
# Ensure the user has permissions for node_modules cache and potential build artifacts
RUN chown -R node:node /app

# Switch to the non-root user
USER node

# Expose the port the app runs on (defined by PORT env var)
EXPOSE ${PORT}

# Healthcheck (optional but recommended)
# Checks if the server is responding on the specified HOST and PORT
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s \
  CMD node -e "require('http').request({ host: process.env.HOST || '0.0.0.0', port: process.env.PORT || 3000, path: '/', method: 'HEAD' }, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1)).end()"

# Command to run the application using the built output
# It will listen on HOST:PORT defined by environment variables
CMD [ "node", "build/index.js" ]
