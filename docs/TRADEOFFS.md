# Tradeoff Decisions

## SQLite + Prisma (vs PostgreSQL)

**Choice:** SQLite for local/dev and assessment simplicity.

**Why:** Zero external services; single file DB; Prisma supports migrations and seeding identically to production Postgres if we swap later.

**Tradeoff:** Write concurrency limited; acceptable for HR admin traffic and demo scale. For real 10k+ concurrent writes, migrate to Postgres.

## Monorepo with npm workspaces (vs separate repos)

**Choice:** One repo, `apps/api` and `apps/web`.

**Why:** Atomic commits across stack; easier for reviewers to follow the 20-commit plan.

**Tradeoff:** No independent deploy versioning per app; mitigated by clear package scripts.

## Domain-first TDD in `apps/api` (vs API-first)

**Choice:** Pure domain modules and tests before Express routes or Prisma.

**Why:** Business rules (pagination math, salary validation, dashboard aggregates) are testable without DB; faster feedback loop.

**Tradeoff:** Extra mapping layer domain ↔ Prisma models; pays off in maintainability.

## Server-side pagination and search (vs client-side)

**Choice:** All list/filter/search on the API with query params.

**Why:** 10,000 rows cannot load in the browser; aligns with NFR for search performance.

**Tradeoff:** More round-trips; offset by debounced search and skeleton loading states.

## REST (vs GraphQL)

**Choice:** REST with resource-oriented routes.

**Why:** Small, fixed surface area (employees, salary, dashboard); simpler for assessment and caching.

**Tradeoff:** Over-fetching possible; not material at this API size.

## Next.js App Router (vs Pages Router)

**Choice:** App Router with minimal Server Components.

**Why:** Current Next default; layout shell and metadata fit App Router well.

**Tradeoff:** Client-heavy tables/forms still need `"use client"`; acceptable for HR dashboards.

## shadcn/ui (vs full component library)

**Choice:** Copy-in shadcn components (Button, Table, Dialog, etc.).

**Why:** Accessible primitives, Tailwind-native, looks like modern SaaS without heavy bundle.

**Tradeoff:** Components live in repo; more files to maintain than importing MUI.

## Single active salary per employee (vs full history in UI)

**Choice:** Data model may store history; Phase 1 UI edits the active record and creates when missing.

**Why:** Matches assessment features (view/edit/create) without building a timeline UI.

**Tradeoff:** Historical reporting deferred; schema can retain rows with `isActive` flag for later.

## No auth in Phase 1

**Choice:** Open API behind local dev; documented as out of scope.

**Why:** Focus on domain, UX, and performance within commit budget.

**Tradeoff:** Not production-deployable without auth middleware; called out in README for commit 19.
