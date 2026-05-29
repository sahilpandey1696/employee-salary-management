# Employee Salary Management

HR platform for browsing ~10,000 employees, managing compensation, and viewing payroll analytics. Built as a monorepo with strict domain-driven TDD on the API and a Vite + React enterprise UI.

## Features

- **Dashboard** — KPIs, charts (salary by country/department, workforce split, top/bottom earners)
- **Employees** — Search (code, name, email), employment status filter, sortable table, pagination (20/page)
- **CRUD** — Add, view, edit, and delete employees with compensation fields
- **Salary API** — View, create, and update active salary per employee (REST)

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | Vite, React 19, React Router, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express 5, TypeScript, Prisma, SQLite |
| Testing | Vitest, React Testing Library, Supertest |

## Prerequisites

- Node.js 20+
- npm 10+

## Quick start

```bash
# Install dependencies
npm install

# API: configure database
cp apps/api/.env.example apps/api/.env

# Generate Prisma client and apply migrations
npm run db:generate
npm run db:migrate

# Seed 10,000 employees (takes a few seconds)
npm run db:seed

# Terminal 1 — API on http://localhost:3001
npm run dev:api

# Terminal 2 — Web on http://localhost:5173
npm run dev:web
```

Open [http://localhost:5173](http://localhost:5173). The dev server proxies `/api/*` to the API (see `apps/web/vite.config.ts`).

## Environment variables

### API (`apps/api/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite connection string | `file:./prisma/dev.db` |
| `PORT` | HTTP port | `3001` |

### Web (`apps/web/.env` optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend origin (use `/api` in dev for Vite proxy) | `/api` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start Express API with hot reload |
| `npm run dev:web` | Start Vite dev server (port 5173) |
| `npm test` | Run all workspace tests |
| `npm run test:api` | API unit and integration tests |
| `npm run test:web` | Frontend unit tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Load 10,000 employees + salaries |
| `npm run build:web` | Production Vite build |

## Project structure

```
├── apps/
│   ├── api/                 # Express API, Prisma, domain logic
│   │   ├── prisma/          # Schema, migrations, seed
│   │   └── src/
│   │       ├── domain/      # Pure business rules (TDD)
│   │       ├── http/        # Routes, middleware
│   │       └── repositories/
│   └── web/                 # Next.js App Router UI
│       └── src/
│           ├── app/           # Pages
│           ├── components/    # UI + feature components
│           └── lib/api/       # API clients
└── docs/                    # Requirements, architecture, tradeoffs
```

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/employees` | List (`page`, `pageSize`, `search`, `country`) |
| `GET` | `/employees/:id/salary` | Active salary |
| `POST` | `/employees/:id/salary` | Create salary |
| `PATCH` | `/employees/:id/salary` | Update amount |
| `GET` | `/dashboard/summary` | Payroll metrics |

Errors return `{ "error": "message" }` with appropriate HTTP status.

## Testing

Domain and HTTP layers are covered by Vitest. Integration tests use an isolated SQLite file at `apps/api/prisma/test.db`.

```bash
npm test
```

## Documentation

- [Requirements](docs/REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Tradeoffs](docs/TRADEOFFS.md)
- [Deployment](docs/DEPLOYMENT.md)
- [AI assistance disclosure](docs/AI_PROMPTS.md)

## Production notes

- Replace SQLite with PostgreSQL for multi-instance deployments; update `DATABASE_URL` and run migrations.
- Add authentication (out of scope for Phase 1) before exposing publicly.
- See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for a deployment checklist.

## License

Private assessment project — not licensed for redistribution.
