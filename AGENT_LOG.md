# Agent Interaction Log

A running record of work done by Claude in this project. Entries are appended chronologically — never overwritten.

---

## [2026-06-26] Project bootstrapping

- Established permission rules and working conventions for Claude via `CLAUDE.md`
- Created `AGENT_LOG.md` (this file) to track Claude's actions across sessions
- Created `README.md` as a placeholder to be filled in as the application is defined
- Decisions deferred: application stack, architecture, and feature scope (to be defined in the next session)

---

## [2026-06-26] Architecture design session

**Prompt given:** Read the spec PDF and discuss the architecture before building anything.

**Spec reviewed:** Exercise_PolicyQuote_AI_Engr.pdf — full-stack home insurance quoting tool with Angular frontend, Node.js Lambda-style backend, and a Knowledge Base-driven risk engine.

**Architecture decisions made:**

**Language:** TypeScript throughout — both frontend and backend. Natural fit for Zod, shared types, and maintainability.

**Monorepo:** Nx workspace managing all apps and libraries in one repo for ease of tooling and build orchestration.

**Library structure:**
- `libs/shared` — Zod schemas and inferred TypeScript types (QuoteRequest, QuoteResponse, KB schema interfaces). Single source of truth for data shapes and validation. Frontend uses the types; backend uses the full Zod schema for runtime validation. Door left open for frontend to use the same Zod schemas for form validation.
- `libs/engine` — Risk scoring engine: KB loader, condition evaluator, risk engine orchestrator. Kept out of the backend so it is deployment-agnostic and reusable by any future consumer.

**Backend (`apps/backend`):**
- Fastify chosen over Express for performance and TypeScript-first design
- `fastify-type-provider-zod` integrates Zod schemas from `libs/shared` directly into Fastify route definitions
- `@fastify/cors` handles CORS
- `@fastify/aws-lambda` wraps the Fastify app for Lambda deployment
- Three files at the entry point: `app.ts` (core Fastify app, deployment-agnostic), `server.ts` (long-running listener for local dev / Fargate), `handler.ts` (Lambda export)
- `npm start` runs `server.ts`

**Frontend (`apps/frontend`):**
- Angular 17+ standalone components only, no NgModules
- Angular Signals for all UI state (loading, quoteResult, errorMessage)
- Each component uses separate `.ts`, `.html`, and `.scss` files
- Global styles in `src/styles/` with partials for variables, reset, and typography; `styles.scss` as the entry point
- `RiskBandBadgeComponent` kept inside the frontend app at `app/shared/components/risk-band-badge/` rather than a separate `libs/ui` library — only one Angular consumer, so a separate library would be over-engineering for a demo

**KB file:** `risk-kb.json` at the repo root as a first-class artifact (as required by the spec).

**What was discussed but decided against:**
- Putting `RiskBandBadgeComponent` in a `libs/ui` library — deferred as unnecessary for a single Angular app demo
- Handling CORS via Angular dev server proxy — decided to handle it in Fastify instead for a cleaner production-equivalent setup

---

## [2026-06-26] Initial application build

**Prompt given:** Let's start building.

**What was built:**

**Nx workspace scaffold:**
- Initialized Nx 23.0.1 workspace manually (existing git repo prevented `create-nx-workspace`)
- Generated Angular frontend app (`@nx/angular:application`) — Angular 21.2, standalone, SCSS
- Generated Node backend app (`@nx/node:application`) — framework:none, esbuild
- Generated `libs/shared` and `libs/engine` with `@nx/js:library`
- TypeScript path aliases registered in `tsconfig.base.json`: `shared → libs/shared/src/index.ts`, `engine → libs/engine/src/index.ts`
- Fixed TypeScript version conflict: Angular 21 requires `>=5.9`, bumped from `~5.5.0` to `~5.9.0`
- Fixed `moduleResolution: bundler` conflict with `module: commonjs` in lib and backend tsconfigs — added explicit `moduleResolution: node` to each

**`risk-kb.json` (repo root):**
- 5 factors: age outside range, 1–2 claims (perOccurrence), 3+ claims (perOccurrence), flat property type, property value >£750k
- `starts_with` and `starts_with_any` operators included in KB schema to support postcode-based factors (e.g. flood zone — expected live demo change)

**`libs/shared`:**
- `kb.schema.ts` — `KbSchema` (Zod), all condition operators including `starts_with_any` for compound prefix matching
- `quote.schema.ts` — `QuoteRequestSchema` (Zod), `QuoteResponse`, `AppliedFactor`, `CoverageDetails` interfaces

**`libs/engine`:**
- `kb-loader.ts` — reads `risk-kb.json` via `KB_PATH` env var or `process.cwd()/risk-kb.json`, validates against `KbSchema`
- `condition-evaluator.ts` — pure function, generic operator dispatch (no hardcoded scoring values)
- `risk-engine.ts` — iterates KB factors, accumulates score, resolves band, calculates premium via `basePremium × riskMultiplier × coverageLoadFactor`
- 5 Jest tests covering STANDARD, ELEVATED, HIGH_RISK bands + perOccurrence multiplier + coverageDetails — all pass

**`apps/backend`:**
- `app.ts` — Fastify app with `fastify-type-provider-zod`, `@fastify/cors`, `GET /health`, `POST /policy/quote`
- `server.ts` — local dev listener (`npm run start:backend`)
- `handler.ts` — Lambda export via `@fastify/aws-lambda`
- `project.json` updated to use `server.ts` as serve entry point

**`apps/frontend`:**
- `styles/` — `_variables.scss` (CSS custom properties), `_reset.scss`, `_typography.scss`; imported via `styles.scss`
- `RiskBandBadgeComponent` — standalone, `riskBand` signal input, three CSS modifier classes
- `QuoteFormComponent` — standalone, reactive form, `loading`/`quoteResult`/`errorMessage` signals, displays premium cards + applied factors + risk summary
- `app.config.ts` — `provideHttpClient()` registered
- Angular `@if`/`@for` control flow used throughout (Angular 17+ syntax)

**Build results:** All 4 projects build clean. 7 tests pass (5 engine + 2 frontend). One minor warning: `quote-form.component.scss` is 389 bytes over the 4KB Nx default budget (non-breaking).

**Decisions made during implementation:**
- `perOccurrence: true` implemented as `points × fieldValue` (e.g. 2 claims × 15pts = 30pts)
- KB loaded once at app startup in `app.ts` (not per-request) — appropriate for a local file
- `starts_with_any` added to condition evaluator proactively, anticipating the live demo flood-zone postcode factor
- Removed auto-generated `nx-welcome.ts` and updated `app.spec.ts` to test the actual app component
