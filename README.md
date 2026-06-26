# PolicyQuote — Policy Risk & Premium Engine

A home insurance quoting tool. Customers enter their details and receive an instant premium estimate with a risk assessment driven by a configurable Knowledge Base.

## Prerequisites

- Node.js 20+
- npm 10+

```bash
npm install
```

## Running the services

**Backend** (http://localhost:3000):
```bash
npm run start:backend
```

**Frontend** (http://localhost:4200):
```bash
npm run start:frontend
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
