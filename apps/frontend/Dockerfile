# syntax=docker/dockerfile:1

# ─── Stage 1: builder ───────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /build

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY nx.json tsconfig.base.json ./
COPY apps/frontend apps/frontend
COPY libs/shared   libs/shared

RUN --mount=type=cache,target=/build/.nx/cache \
    npx nx build frontend --configuration=production

# ─── Stage 2: nginx runtime ─────────────────────────────────────────────────
FROM nginx:alpine AS frontend

COPY --from=builder /build/dist/apps/frontend/browser /usr/share/nginx/html
COPY apps/frontend/nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY apps/frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# Default matches the docker-compose service name; override with -e AIG_BACKEND_URL=... at runtime
ENV AIG_BACKEND_URL=http://backend:3000

ENTRYPOINT ["/docker-entrypoint.sh"]
