# Agent Interaction Log

A running record of work done by Claude in this project. Entries are appended chronologically — never overwritten.

---

## [2026-06-26] Project bootstrapping

**User prompts / decisions:**
- "I am building an application however I would first like to set some initial rules in terms of capabilities of claude"
- Specified four permission rules: never auto-commit; never auto-push; ask before destructive file operations; restrict all bash operations to this folder
- "I would also like you to keep a log of our interactions. This can be kept in a file called AGENT_LOG.md. In addition, I would like to establish a README.md"

**What was implemented:**
- Permission rules and logging conventions written to `CLAUDE.md`
- `AGENT_LOG.md` created as the running interaction log
- `README.md` created as a placeholder

**Files created or modified:**
- `CLAUDE.md`, `AGENT_LOG.md`, `README.md`

**Deferred:**
- Application stack, architecture, and feature scope — left for the next session

---

## [2026-06-26] Architecture design session

**User prompts / decisions:**
- Provided the spec PDF: `Exercise_PolicyQuote_AI_Engr.pdf`
- "Firstly both of these applications will be developed in TypeScript"
- "Given that it is likely (and desirable) that any models and validation developed are shared between the frontend and backend, I think that these could be placed into a separate library. Given that it is essentially a demo I would like to keep all applications and libraries in one repo together with ease of tooling and build, I would like to use an Nx workspace to manage the code"
- On shared validation: "The front end can use the types, but the door should be left open that the same validation that happens in the backend is also used to ensure that the form data is valid"
- "For the backend I believe that using fastify would be the best choice. Allowing the core of the app to be defined in one place deployment agnostic, then have two separate TS files that use that, one for long running local server, the other as a handler for AWS Lambda"
- On where to put the engine: "lets talk about the engine separately. I am not sure I want it in the backend, better to put it in a shared library and have it used by the backend. This makes it potentially reusable"
- On library naming: "yes, `shared` and `engine` works for me"
- "The front end should also have a styles folder?"
- "Each component in Angular should have separate HTML template and SCSS. We can handle CORS in the backend"
- On the RiskBandBadge component: "The RiskBandBadgeComponent could be placed in a shared library?" → then accepted the counter-argument: "You are right, let's keep it in the apps/frontend"
- "Can you log this conversation to the AGENT_LOG before we start building"

**What was implemented:**
- Architecture agreed: Nx 23 monorepo, TypeScript throughout, Angular 21 frontend, Fastify backend, `libs/shared` (Zod schemas + types), `libs/engine` (pure scoring logic)
- Fastify entry point pattern agreed: `app.ts` (deployment-agnostic), `server.ts` (local/Fargate), `handler.ts` (Lambda)
- CORS to be handled in Fastify, not via dev-server proxy
- `RiskBandBadgeComponent` to live in `apps/frontend`, not a separate UI library

**Files created or modified:**
- `AGENT_LOG.md` (entry added)

**Deferred:**
- Actual code build — scheduled for next prompt

---

## [2026-06-26] Initial application build

**User prompts / decisions:**
- "let's start building"
- "Please update the CLAUDE.md to include the architectural decisions to date"
- "Additionally add the nx command to run both backend and frontend simultaneously — update both the README.md and CLAUDE.md"

**What was implemented:**
- Nx 23.0.1 workspace scaffolded manually (existing git repo prevented `create-nx-workspace`)
- Angular 21.2 frontend app, Node backend app, `libs/shared`, `libs/engine` generated
- TypeScript path aliases registered: `shared`, `engine`
- `risk-kb.json` at repo root with 5 factors and 3 risk bands
- `libs/shared`: `kb.schema.ts` (Zod discriminated union, 9 operators), `quote.schema.ts`
- `libs/engine`: `kb-loader.ts`, `condition-evaluator.ts` (switch dispatch), `risk-engine.ts`, 5 Jest tests
- `apps/backend`: `app.ts`, `server.ts`, `handler.ts`
- `apps/frontend`: global styles, `RiskBandBadgeComponent`, `QuoteFormComponent` (signals, reactive form, HTTP)
- `package.json` `start` script added: `nx run-many --target=serve --projects=frontend,backend`
- `CLAUDE.md` updated with full architecture and conventions section
- `README.md` updated with combined start command

**Files created or modified:**
- All source files across `apps/` and `libs/`, plus `risk-kb.json`, `CLAUDE.md`, `README.md`, `package.json`

**Notable fixes during build:**
- TypeScript version bumped to `~5.9.0` (Angular 21 requirement)
- `moduleResolution: node` added to `libs/shared`, `libs/engine`, and `apps/backend` tsconfigs to resolve bundler/commonjs conflict
- SCSS import path corrected in `quote-form.component.scss`
- `nx-welcome.ts` removed; `app.spec.ts` rewritten for the actual app component

**Deferred:**
- SOLUTION.md (required deliverable, max 300 words)
- Engine algorithm improvements

---

## [2026-06-28] Engine algorithm refactor — Strategy pattern, coercion, map/reduce

**User prompts / decisions:**
- "The engine works well as is, however it could be improved through the use of a suitable GOF pattern. I'm thinking the strategy pattern, particularly with respect to applying the operation against the source data. Can we explore this?"
- "I think we can improve on this with the evaluation of the final score by using map reduce on the collection of KB source rules, the map part tests each condition, the reduce provides a scoring. along the lines of `list.map((rule) -> rule evaluation producing score).reduce(...)`"
- "In evaluating the rule condition we need to factor in that in future the source attribute might not just be a number. Examine the evaluation code to ensure proper type coercion and comparison"
- On coercion direction: "I think bidirectional coercion is best" (i.e. `coerceToString` should also convert finite numbers to strings, not just handle native strings)
- "Also please do not alter the existing tests for the engine so that we can confirm that the refactor works"
- "Finally, we should cut a branch to work on this feature. Name it appropriately"
- "Also please update the agent log with what we have discussed including amendments and corrections"
- "I would like to address deficiency in the audit log. Currently it logs summaries of decisions reached. I would like it to include the questions I asked or decisions I made" → prompted this format change

**What was implemented:**
- Branch `feature/engine-strategy-and-scoring` cut
- `coerce-value.ts`: `coerceToNumber` (numeric strings, guards NaN) and `coerceToString` (bidirectional — finite numbers → string)
- `operator-strategies.ts`: `ConditionStrategy<Op>` interface, `StrategyMap` mapped type, 9 strategy objects using `satisfies` for exhaustiveness and contextual typing; all strategies use coercion helpers
- `condition-evaluator.ts`: switch replaced with single strategy dispatch; correlated union limitation explained in comment
- `risk-engine.ts`: mutable for-loop replaced with `.map().filter().reduce()` pipeline; `perOccurrence` uses `coerceToNumber`
- `operator-strategies.spec.ts`: 38 new isolated tests covering boundary values, coercion edge cases, NaN, Infinity, null
- Existing `engine.spec.ts` (5 tests) untouched — all pass as regression gate
- `CLAUDE.md` log format updated to capture user prompts and decisions
- `AGENT_LOG.md` backfilled with actual prompts and decisions from prior sessions

**Files created or modified:**
- `libs/engine/src/lib/coerce-value.ts` (new)
- `libs/engine/src/lib/operator-strategies.ts` (new)
- `libs/engine/src/lib/operator-strategies.spec.ts` (new)
- `libs/engine/src/lib/condition-evaluator.ts` (replaced)
- `libs/engine/src/lib/risk-engine.ts` (updated)
- `libs/engine/src/index.ts` (additive exports)
- `CLAUDE.md` (log format rule updated)
- `AGENT_LOG.md` (backfilled and current entry added)

**Deferred:**
- SOLUTION.md
- Frontend improvements
- Merging `feature/engine-strategy-and-scoring` to main

---

## [2026-06-28] KB hot-reload, file watching, and split health endpoints

**User prompts / decisions:**
- "model versioning, loading and health"
- On model versioning: "Closer to option 1. The KB schema is versioned. I would like to monitor for changes to the source KB json file after initial load. If the version changes, then the loader should attempt to reload it. If the updated version is not valid, the last good loaded KB data is used, otherwise the backend switches to the new version without need to restart"
- On loading: startup error handling + monitor for changes to `risk-kb.json` + attempt reload if version changes
- On health: both enriched detail and liveness/readiness split

**What was implemented:**
- New `apps/backend/src/kb-manager.ts` — `KbManager` class with `KbLoadStatus` discriminated union type
  - Constructor loads KB synchronously; rethrows with structured `KB_LOAD_FAILED` message on failure
  - `startWatching()` — `fs.watch` with `persistent: false`, 200 ms debounce to coalesce rapid editor saves
  - `stopWatching()` — closes watcher and cancels any pending debounce timer
  - `reload()` — loads candidate KB; if version unchanged → skip; if valid new version → hot-swap; if invalid → keep last good KB and set status to `{ state: 'error' }`
- `apps/backend/src/app.ts` — `buildApp(kbManager: KbManager)` now takes KbManager as dependency injection
  - `/health` replaced with `/health/live` (always 200, uptime only) and `/health/ready` (200 ok / 503 degraded with KB detail)
- `apps/backend/src/server.ts` — structured startup guard with `process.exit(1)`, `startWatching()`, `onClose` hook for teardown
- `apps/backend/src/handler.ts` — injects KbManager without watching (Lambda is stateless)
- `apps/backend/tsconfig.app.json` — added `exclude: ["src/**/*.spec.ts"]` to prevent spec files from polluting the production build
- Test infrastructure added: `jest.config.cts`, `tsconfig.spec.json`, `project.json` test target, `tsconfig.json` spec reference
- `apps/backend/src/kb-manager.spec.ts` — 8 unit tests covering: initial load, status shape, startup failure, version-change swap, same-version no-op, invalid reload fallback, debounce coalescing, stopWatching timer cancellation

**Files created or modified:**
- `apps/backend/src/kb-manager.ts` (new)
- `apps/backend/src/kb-manager.spec.ts` (new)
- `apps/backend/jest.config.cts` (new)
- `apps/backend/tsconfig.spec.json` (new)
- `apps/backend/src/app.ts` (updated)
- `apps/backend/src/server.ts` (updated)
- `apps/backend/src/handler.ts` (updated)
- `apps/backend/tsconfig.app.json` (exclude spec files)
- `apps/backend/tsconfig.json` (add spec reference)
- `apps/backend/project.json` (add test target)
- `AGENT_LOG.md` (this entry)

**Notable fix during implementation:**
- `tsconfig.app.json` had `include: ["src/**/*.ts"]` with no exclusion — the spec file was being compiled as production code and failing because Jest types weren't available. Fixed by adding `exclude: ["src/**/*.spec.ts"]`.

**Deferred:**
- Linux inotify atomic-rename edge case: `fs.watch` follows the inode on Linux; if an editor writes via rename, the watcher may stop receiving events. Documented in code comment; fix would be to re-create the watcher on `rename` events or switch to `chokidar`.
- SOLUTION.md
- Frontend improvements

---

## [2026-06-28] Typed health response schemas in libs/shared

**User prompts / decisions:**
- "I would like you to model the responses from the health endpoints as interfaces in the libs shared library instead of returning untyped json"
- Security correction: "I would like you to not include the path of the KB file in the health response. This is a security concern" — `path` removed from both response schemas

**What was implemented:**
- New `libs/shared/src/lib/health.schema.ts` with three Zod schemas and inferred TypeScript types:
  - `HealthLiveResponseSchema` / `HealthLiveResponse` — `{ status: 'alive', uptime }`
  - `HealthReadyOkResponseSchema` / `HealthReadyOkResponse` — `{ status: 'ready', uptime, kb: { version, loadedAt } }`
  - `HealthReadyDegradedResponseSchema` / `HealthReadyDegradedResponse` — `{ status: 'degraded', uptime, kb: { lastGoodVersion, lastGoodAt, errorReason } }`
  - `path` deliberately omitted from all responses to avoid leaking server directory structure
  - `Date` fields typed as `z.string()` (ISO wire format) and converted via `.toISOString()` in the handler
- `libs/shared/src/index.ts` updated to export health schemas
- `apps/backend/src/app.ts` updated: both health routes now declare `schema: { response: { ... } }` using the Zod schemas; handlers typed against inferred types; `path` field removed from returned objects

**Files created or modified:**
- `libs/shared/src/lib/health.schema.ts` (new)
- `libs/shared/src/index.ts` (additive export)
- `apps/backend/src/app.ts` (updated health routes)

**Deferred:**
- SOLUTION.md
- Frontend improvements
- Committing and merging `feature/kb-hot-reload-and-health`

---

## [2026-06-28] Fargate Health — ECS metadata and /health alias

**User prompts / decisions:**
- /plan "Fargate Health"
- "Include ECS metadata in the model response from /health/ready. Also add a GET /health in the app that proxies /health/ready"
- Correction during planning: "When a method can return one of two or more types, can you cast the json created to the type intended, i.e return { json } as type. It makes it a little clearer for those developers coming after (and also will flag if someone alters the json incorrectly)"
- "Cut a feature branch and name appropriately. Update the agent log also"

**Branch:** `feature/fargate-health-ecs-metadata`

**What was implemented:**
- `libs/shared/src/lib/health.schema.ts` — added `EcsMetadataSchema` (cluster, taskArn, taskFamily, taskRevision) and optional `ecs` field to both `HealthReadyOkResponseSchema` and `HealthReadyDegradedResponseSchema`; exported `EcsMetadata` type
- `apps/backend/src/ecs-metadata.ts` (new) — `fetchEcsMetadata()` using Node 20 `fetch`; reads `ECS_CONTAINER_METADATA_URI_V4` env var; returns `null` when not on Fargate or on any error — callers omit the `ecs` field when `null`; returns object `as EcsMetadata`
- `apps/backend/src/app.ts` — extracted `buildReadyBody()` helper inside `buildApp()`; both `/health/ready` and `/health` (ALB default probe path) share this helper; returned object literals cast to `as HealthReadyOkResponse` / `as HealthReadyDegradedResponse` per preference

**Design decisions:**
- `ecs` is `optional()` in both Zod schemas — absent in local dev and Lambda, present only on Fargate
- `buildReadyBody()` is a plain async function (no Fastify params), avoiding the need for explicit `FastifyRequest`/`FastifyReply` type imports; both routes call it identically
- `GET /health` returns an identical response to `/health/ready` — motivator is ALB health check probing `/health` by default, avoiding deployment-side config overhead
- Explicit `as Type` casts on returned object literals so union-typed functions make their branch intent clear and TypeScript flags shape regressions

**Files created or modified:**
- `libs/shared/src/lib/health.schema.ts` (updated)
- `apps/backend/src/ecs-metadata.ts` (new)
- `apps/backend/src/app.ts` (updated)

**Verification:** 52 tests pass (shared 1, engine 43, backend 8); `nx build shared backend` compiles clean.

**Deferred:**
- SOLUTION.md
- Frontend improvements
- Committing and merging feature branches to main

---

## [2026-06-28] Docker deployment — Fargate and Lambda images

**User prompts / decisions:**
- /plan "Backend Deployment"
- Target: both Fargate and Lambda
- IaC tool: Docker only (no CDK / Terraform)
- CI/CD: out of scope
- Question raised: "Consider using a multistage docker build that builds the backend as part of the process of producing the final layer. What are your thoughts on this in relation to nx in the docker build path?" — confirmed multi-stage with Nx in builder stage is the right approach; plan updated with BuildKit cache mount rationale
- "Cut a feature branch. Update the agent log and update the README on how to build and locally run the docker deployment."

**Branch:** `feature/docker-deployment`

**What was implemented:**
- `Dockerfile` (multi-stage, repo root):
  - Stage 1 `builder`: full `npm ci` → `npx nx run backend:prune` (compile + prune lockfile + copy workspace modules) → `npm ci --omit=dev` in `dist/apps/backend/`
  - BuildKit `--mount=type=cache` on `/root/.npm` and `/build/.nx/cache` so unchanged libs (shared, engine) skip recompilation on backend-only changes
  - Stage 2 `fargate`: `node:22-alpine`, WORKDIR `/app`, copies dist + `risk-kb.json`, HEALTHCHECK on `/health/live`, `CMD ["node", "server.js"]`
  - Stage 3 `lambda`: `public.ecr.aws/lambda/nodejs:22` base, copies dist + `risk-kb.json` to `LAMBDA_TASK_ROOT`, `CMD ["handler.handler"]`
- `.dockerignore`: excludes `node_modules`, `dist`, `.git`, Nx cache, `coverage`, frontend app, spec files, markdown
- `docker-compose.yml`: Fargate target on port 3000 for local testing
- `README.md`: added Docker section covering build commands, local run via docker-compose, health endpoint smoke test, Lambda deployment note

**Design decisions:**
- Nx build runs inside the builder stage (not pre-built on host) for full reproducibility
- `nx run backend:prune` is used (not just `nx build backend`) — the prune pipeline produces a pruned lockfile and copies workspace libs so the final dist is self-contained
- KB path resolves via `process.cwd() + '/risk-kb.json'`; WORKDIR aligns with this so no `KB_PATH` override is needed in either image
- `/health/live` (not `/health/ready`) used for the Fargate HEALTHCHECK — avoids a degraded KB state incorrectly killing a running task
- Lambda container image used (not zip) — consistent with "Docker only" IaC decision

**Files created or modified:**
- `Dockerfile` (new, repo root)
- `.dockerignore` (new, repo root)
- `docker-compose.yml` (new, repo root)
- `README.md` (Docker section added)
- `AGENT_LOG.md` (this entry)

**Deferred:**
- Docker build smoke test (requires Docker daemon)
- SOLUTION.md
- Frontend improvements
- Committing and merging feature branches to main

---

## [2026-06-28] Dockerfile USER hardening (amendment to Docker deployment)

**User prompts / decisions:**
- "The application should run as a USER rather than root"

**What was implemented:**
- Fargate stage: `COPY --chown=node:node` on both COPY instructions; `USER node` added before `CMD`. Uses the `node` user (uid 1000) built into `node:22-alpine` — no adduser step needed.
- Lambda stage: left as root. The AWS Lambda runtime interface requires root to initialise and transitions to its own sandboxed user (`sbx_user1051`) internally at invocation time. A comment in the Dockerfile records this rationale.

**Files modified:**
- `Dockerfile`
