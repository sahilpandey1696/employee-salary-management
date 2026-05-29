# Architecture Notes

## Overview

Monorepo with two packages:

```
employee-salary-management/
├── apps/api/          # Express + Prisma + SQLite
├── apps/web/          # Next.js + Tailwind + shadcn/ui
└── docs/
```

The API owns persistence and business rules. The web app is a client that calls REST endpoints. Domain logic lives in pure TypeScript modules tested with Vitest before any HTTP or DB wiring.

## Layering (API)

```
HTTP (routes/controllers)
    → Application services (use cases)
        → Domain (entities, validation, calculations)
            → Infrastructure (Prisma repositories)
```

- **Domain:** No Express or Prisma imports. Fully unit-tested.
- **Application:** Orchestrates domain + repositories; thin.
- **Infrastructure:** Prisma client, SQLite, seed script.
- **HTTP:** Request validation, status codes, error mapping.

## Layering (Web)

```
Pages (App Router)
    → Feature components (employees, salary, dashboard)
        → Shared UI (shadcn, table, dialogs)
            → API client (fetch wrapper, typed responses)
```

Server Components where possible for layout; client components for interactive tables, search, and forms.

## Key flows

### Employee list

1. Client sends `GET /employees?page&pageSize&search&country`
2. Service builds Prisma query with `WHERE` + `SKIP/TAKE`
3. Indexes on `country`, `fullName`, `employeeNumber` support search at scale

### Salary update

1. Client sends `PATCH /employees/:id/salary`
2. Domain validates amount; service deactivates prior active record and inserts new row (or updates per rules)
3. Confirmation dialog on client before submit

### Dashboard

1. `GET /dashboard/summary` — aggregated queries (sum, avg, group by country)
2. Computed in service layer using Prisma `aggregate` / `groupBy`; optional domain helpers for pure math

## Testing strategy

| Layer | Tool | When |
|-------|------|------|
| Domain | Vitest (api package) | Commits 3–8 (TDD) |
| API integration | Vitest + supertest (later) | After routes exist |
| UI | Vitest + RTL (web package) | Commits 13–16 |

Strict TDD for domain first; infrastructure and UI follow failing tests per milestone.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production checklist, environment variables, and hosting notes.

- **API:** Node process; `DATABASE_URL` (SQLite dev, Postgres recommended for prod)
- **Web:** Next.js build; `API_URL` for rewrite proxy to API
- Seed once: `npm run db:seed` → 10,000 employees

## Package boundaries

| Package | Responsibility |
|---------|----------------|
| `@esm/api` | REST API, Prisma, seed, domain |
| `@esm/web` | UI only; no direct DB access |

Cross-package types: duplicate minimal DTO shapes in web or share via a small `packages/types` later if duplication hurts; Phase 1 favors simplicity over shared package.
