FROM node:22-alpine AS builder
WORKDIR /app
# Clean potential stale build artifacts before installing dependencies
RUN rm -rf .svelte-kit
COPY package*.json ./

RUN npm ci

COPY . .

# Build the SvelteKit app (let vite handle .svelte-kit)
RUN npm run build && \
    npm prune --production

FROM node:22-alpine
WORKDIR /app

ARG VERSION=0
ENV VERSION=$VERSION

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

ENV ORIGIN='http://localhost:3000'

COPY config.example.yaml /app/config.example.yaml

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/build build/

RUN chown -R node:node /app

USER node

EXPOSE ${PORT}

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s \
  CMD node -e "require('http').request({ host: process.env.HOST || '0.0.0.0', port: process.env.PORT || 3000, path: '/api/health', method: 'HEAD' }, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1)).end()"

# Add flags for better debugging
CMD [ "node", "--trace-warnings", "--enable-source-maps", "build/index.js" ]
