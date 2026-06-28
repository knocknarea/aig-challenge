# Claude Rules for this Project

## Permission Boundaries

1. **Never auto-commit.** Always ask the user before creating any git commit, without exception.

2. **Never commit directly to `main`.** All commits must go to a feature or chore branch. Always verify the current branch with `git branch` before committing. If on `main`, stop and ask the user which branch to use.

3. **Never auto-push.** Always ask before pushing to any remote branch or origin.

3. **Ask before destructive file operations.** Confirm with the user before: deleting any file, running `rm`, `git reset --hard`, `git checkout --`, `git clean`, or overwriting uncommitted changes.

4. **Restrict all bash and file operations to this directory.** All commands, reads, writes, deletes, and moves must stay within `/Users/adrian/develop/interviews/aig-policy-quote`. Do not operate on paths outside this directory.

## Interaction Log

5. **Maintain AGENT_LOG.md.** After completing any meaningful unit of work in a session, append an entry to `AGENT_LOG.md` at the project root. Never overwrite the file — only append. Use this format:

```
## [YYYY-MM-DD] <short title>

**User prompts / decisions:**
- The user's actual question or instruction (verbatim or close paraphrase)
- Specific choices the user made when presented with alternatives
- Amendments or corrections the user asked for mid-session

**What was implemented:**
- What was built or changed, and why

**Files created or modified:**
- Key files affected

**Deferred:**
- Any decisions or tasks explicitly left for a later session
```

## Project Documentation

6. **Maintain README.md.** Keep `README.md` up to date as the application evolves. Update it whenever the project structure, stack, or run instructions change.

---

## Architecture & Conventions

### Stack
- **Nx 23 monorepo** — single repo, single `package.json`, shared `node_modules`
- **TypeScript throughout** — all apps and libs; no JavaScript files
- **Angular 21** (frontend) — standalone components only, no NgModules
- **Fastify** (backend) — `fastify-type-provider-zod`, `@fastify/cors`, `@fastify/aws-lambda`
- **Zod** (shared) — in `libs/shared`; single source of truth for request/response shapes and KB schema

### Project structure
- `apps/frontend` — Angular app. Each component has separate `.ts`, `.html`, `.scss` files. Signals for all local UI state (`loading`, `quoteResult`, `errorMessage`). No component libraries.
- `apps/backend` — `app.ts` (Fastify app, deployment-agnostic), `server.ts` (local dev / Fargate listener), `handler.ts` (Lambda export via `@fastify/aws-lambda`).
- `libs/shared` — Zod schemas + inferred TypeScript types only. No runtime logic. Used by both frontend (types) and backend (validation).
- `libs/engine` — Pure business logic: `kb-loader.ts`, `condition-evaluator.ts`, `risk-engine.ts`. No Fastify, no Angular. Used only by the backend.
- `risk-kb.json` — Knowledge Base at the repo root. Never move it into a source folder.

### Coding rules
- **KB-driven scoring only.** No hardcoded scoring values in application code. All factors, points, operators, thresholds, and multipliers live in `risk-kb.json`.
- **No external UI component libraries.** All CSS is hand-written. CSS custom properties are defined in `apps/frontend/src/styles/_variables.scss`.
- **No LLMs or external APIs from the backend.** All scoring is deterministic and self-contained.
- **Angular Signals only for local UI state.** No `BehaviorSubject` or `Subject`.
- **Condition evaluator is generic.** Adding a new risk factor = KB change only. Adding a new operator = edit `libs/engine/src/lib/condition-evaluator.ts` only.

### TypeScript path aliases (defined in `tsconfig.base.json`)
- `import { ... } from 'shared'` — types and Zod schemas
- `import { ... } from 'engine'` — `loadKb`, `calculateQuote`, `evaluateCondition`

### Running the workspace
- `npm start` → both services simultaneously (Angular on 4200, Fastify on 3000)
- `npm run start:frontend` → Angular dev server only
- `npm run start:backend` → Fastify only
- `npx nx run-many --targets=build,test --projects=shared,engine,backend,frontend` → full build + test
