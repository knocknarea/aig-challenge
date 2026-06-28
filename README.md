# PolicyQuote — Policy Risk & Premium Engine

A home insurance quoting tool. Customers enter their details and receive an instant premium estimate with a risk assessment driven by a configurable Knowledge Base.

## Prerequisites

- Node.js 20+
- npm 10+

```bash
npm install
```

## Docker deployment

Each app owns its Dockerfile (`apps/backend/Dockerfile`, `apps/frontend/Dockerfile`). All builds use the repo root as context. Docker 23+ (BuildKit enabled by default) is required; on older versions prefix commands with `DOCKER_BUILDKIT=1`.

### Run the full stack locally

```bash
docker-compose up --build
```

- Frontend: `http://localhost:4200` — nginx serves the Angular SPA and proxies `/api/*` to the backend
- Backend: `http://localhost:3000` — Fastify (also reachable via the frontend proxy)

### Build individual images

```bash
# Backend — Fargate image
docker build -f apps/backend/Dockerfile --target fargate -t policy-quote-backend:fargate .

# Backend — Lambda container image
docker build -f apps/backend/Dockerfile --target lambda -t policy-quote-backend:lambda .

# Frontend — nginx image
docker build -f apps/frontend/Dockerfile -t policy-quote-frontend .
```

Subsequent builds are fast: BuildKit caches the npm download cache and the Nx computation cache between runs, so only changed source files are recompiled.

### Health check endpoints (via nginx proxy)

```bash
curl http://localhost:4200/api/health/live    # liveness — always 200
curl http://localhost:4200/api/health/ready  # readiness — 200 ok / 503 degraded
```

### Backend Lambda target

The Lambda image uses the `public.ecr.aws/lambda/nodejs:22` base. Push to ECR and configure the Lambda function with handler `handler.handler`. To test locally, use the [AWS Lambda Runtime Interface Emulator](https://github.com/aws/aws-lambda-runtime-interface-emulator).

### Frontend environment configuration

The frontend calls `/api/policy/quote` (relative path). nginx resolves this at runtime via the `BACKEND_URL` environment variable — no rebuild needed to point at a different backend:

```bash
# Production Fargate example
docker run -e BACKEND_URL=http://internal-alb.example.com -p 80:80 policy-quote-frontend
```

## Running the services

**Both services together:**
```bash
npm start
```

This starts the Angular dev server (http://localhost:4200) and the Fastify backend (http://localhost:3000) simultaneously.

**Individually:**
```bash
npm run start:backend    # Fastify on port 3000
npm run start:frontend   # Angular on port 4200
```

## Knowledge Base

The risk scoring rules live in `risk-kb.json` at the repo root. Adding, removing, or changing a risk factor requires only a KB change — no code changes. Set `KB_PATH` to point to an alternative KB file.

## Project structure

```
apps/
  frontend/    # Angular 21 standalone app
  backend/     # Fastify — app.ts / server.ts / handler.ts
libs/
  shared/      # Zod schemas and TypeScript types (shared by both apps)
  engine/      # KB loader, condition evaluator, risk engine
risk-kb.json   # Knowledge Base — first-class artifact
```

## Running tests

```bash
npx nx run-many --target=test --projects=shared,engine,frontend
```

## Architecture

- **Angular 21** frontend — standalone components, Angular Signals, reactive forms, no component libraries
- **Fastify** backend — `@fastify/aws-lambda` for Lambda deployment, `fastify-type-provider-zod` for request validation
- **Nx monorepo** — shared TypeScript path aliases (`shared`, `engine`) across all projects
- **KB-driven engine** — table-driven condition evaluator; the scoring engine never needs to change when rules change
