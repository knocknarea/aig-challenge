# Solution

## Approach

A full-stack Nx monorepo: Angular 21 frontend, Fastify backend, and two shared libraries (`shared` for Zod schemas and types, `engine` for pure scoring logic). The risk engine is entirely KB-driven — all factors, operators, thresholds, and multipliers live in `risk-kb.json`. No scoring values are hardcoded in application code; adding a new risk factor requires only a KB change.

## Key Decisions

**Strategy pattern for condition evaluation.** Each leaf operator (`eq`, `gt`, `gte`, `lt`, `lte`, `between`, `outside_range`, `starts_with`, `starts_with_any`) is an isolated strategy object. Adding a new operator means adding one entry to the strategy map — no switch statements, no risk of regressions in other operators. `satisfies StrategyMap` enforces exhaustiveness at compile time. Compound logical operators (`and`, `or`, `not`) compose leaf conditions recursively: the evaluator resolves them via short-circuit logic before delegating to the strategy map, and the Zod schema uses named typed consts and `z.lazy()` to express arbitrarily nested conditions without circular type definitions.

**Bidirectional type coercion.** The KB stores conditions as typed values; source data arrives as `unknown`. Coercion helpers (`coerceToNumber`, `coerceToString`) handle the mismatch cleanly without runtime surprises, and make the engine resilient to string/number ambiguity in input payloads.

**KB hot-reload.** `KbManager` watches `risk-kb.json` with a 200ms debounce. If the version changes and the new file is valid, the backend hot-swaps without restart. On parse failure it retains the last-good KB and surfaces the error reason through `/health/ready`.

**Split health endpoints.** `/health/live` (always 200) and `/health/ready` (200/503 with KB status and optional ECS task metadata) follow the liveness/readiness contract expected by ALB and ECS. `GET /health` aliases `/health/ready` for the ALB default probe path.

**Docker deployment.** Multi-stage Dockerfiles (one per app, build context at repo root) produce a Fargate image and a Lambda container image for the backend, and an nginx image for the frontend. The Angular app calls `/api/` (relative); nginx proxies this to the backend at runtime via `BACKEND_URL` — no rebuild needed to retarget a different environment.

## Trade-offs

The KB-as-JSON approach is flexible but puts schema discipline on the operator; malformed KB entries fail at load time (surfaced via `/health/ready`) rather than silently at score time. Hot-reload adds complexity but avoids restart-induced downtime when rules change in production.

## Given more time

**Factor exclusion / compound precedence.** The current engine uses an additive scoring model: all matching factors score independently. When a compound condition (`Flat AND value > £500k`) fires alongside a simple condition that overlaps (`value > £500k`), both contribute points. The right fix is an optional `excludes: string[]` field on `KbFactorSchema` — when a factor fires, it suppresses the listed factor IDs from the result. This keeps the exclusion logic in the KB and requires only a small post-map filter in the engine.

**Postcode validation.** The quote form accepts any string for postcode. This should include a UK postcode format check (regex against the Royal Mail standard) and ideally a lookup against a postcode API to confirm the postcode exists and to derive region-level risk data (flood zone, crime statistics) that could feed additional KB factors.

**AIG style guide UI skill.** A Claude Code skill (`/aig-style`) that reads the AIG brand guidelines and applies them to the Angular frontend: brand colours as CSS custom properties, typography scale, logo placement, form layout conventions, and component spacing. This would give the application a production-grade AIG look without manual design iteration.
