# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.base.json tsconfig.json rollup.config.ts ./
COPY src/ ./src/
RUN npm run package

# Stage 2: Runtime
FROM node:24-alpine AS runtime
RUN apk add --no-cache git
WORKDIR /app
COPY --from=builder /build/dist/cca.js ./dist/cca.js
RUN printf '#!/bin/sh\nexec node /app/dist/cca.js "$@"\n' > /usr/local/bin/cca \
    && chmod +x /usr/local/bin/cca
