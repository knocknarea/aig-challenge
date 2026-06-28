# syntax=docker/dockerfile:1

# ─── Stage 1: builder ───────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /build

COPY package*.json ./
# BuildKit cache: npm download cache persists between builds; never lands in the image
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY nx.json tsconfig.base.json ./
COPY apps/backend apps/backend
COPY libs/shared  libs/shared
COPY libs/engine  libs/engine
COPY risk-kb.json ./

# BuildKit cache: Nx computation cache persists between builds;
# unchanged libs (shared, engine) skip recompilation on backend-only changes
RUN --mount=type=cache,target=/build/.nx/cache \
    npx nx run backend:prune

# Install production-only deps inside the dist output using the pruned lockfile
RUN --mount=type=cache,target=/root/.npm \
    cd dist/apps/backend && npm ci --omit=dev --ignore-scripts

# ─── Stage 2: Fargate ───────────────────────────────────────────────────────
FROM node:22-alpine AS fargate
WORKDIR /app

# Self-contained dist: compiled JS, workspace_modules, production node_modules
# --chown ensures files are owned by the non-root node user (uid 1000, built into node:alpine)
COPY --from=builder --chown=node:node /build/dist/apps/backend .

# KB file at WORKDIR — process.cwd() resolves to /app, so no KB_PATH override needed
COPY --from=builder --chown=node:node /build/risk-kb.json .

ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0

EXPOSE 3000

# /health/live always returns 200 regardless of KB state — correct probe for liveness
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/live || exit 1

USER node

CMD ["node", "server.js"]

# ─── Stage 3: Lambda container image ────────────────────────────────────────
FROM public.ecr.aws/lambda/nodejs:22 AS lambda

# LAMBDA_TASK_ROOT=/var/task; process.cwd() in Lambda is also /var/task,
# so the default KB path (process.cwd()/risk-kb.json) resolves correctly
COPY --from=builder /build/dist/apps/backend ${LAMBDA_TASK_ROOT}/
COPY --from=builder /build/risk-kb.json      ${LAMBDA_TASK_ROOT}/

# Lambda runtime interface manages its own user context (sbx_user1051) internally;
# the container must start as root for the runtime to initialise correctly.

# <module>.<export>: handler.js exports a function named handler
CMD ["handler.handler"]
