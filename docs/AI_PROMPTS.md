# AI Assistance Disclosure

This document is included for **transparency** in the hiring assessment. The application was **designed and reviewed by me**; I used **Cursor (AI-assisted coding)** as a productivity tool for boilerplate, test scaffolding, and iteration—not as a substitute for understanding the code.

## How I used AI

| Area | My work | Where AI helped |
|------|---------|-----------------|
| Requirements & architecture | Wrote and refined scope, tradeoffs, folder structure | Drafting doc outlines from my bullet points |
| Domain logic | Reviewed rules for pagination, salary validation, dashboard math | Suggesting edge-case tests after I described behavior |
| API & UI | Chose endpoints, UX flows, component split | Generating initial route/component stubs I then edited |
| Git history | Planned 20 small commits (TDD red → green) | Suggesting commit messages; I approved each step |

I **read, ran, and adjusted** generated code (tests, types, error handling) before treating any milestone as done.

## Sample prompts (representative)

Below are **examples** of instructions I gave the assistant—not a full chat log. Wording varied; intent stayed the same.

### 1. Project setup

> Set up a monorepo: Next.js + Tailwind + shadcn on the web, Express + Prisma + SQLite on the API, Vitest on both. Add a failing smoke test first, then minimal config to pass it.

### 2. Domain work (TDD)

> Write **only failing tests** for employee list rules: search, country filter, pagination, stable sort. Stop—no implementation until I commit the test file.

> Implement the minimum code to make those tests pass. No extra features.

(Same pattern for salary records and dashboard aggregates.)

### 3. Data for demo scale

> Add a **seed script** that creates **10,000 synthetic employees** with realistic-ish names, countries, and one active salary each. Data is **dummy/generated for assessment**, not real HR records. Use batched inserts for speed.

### 4. UI features

> Build an employee table with debounced search, country filter, loading/empty/error states, and a dialog to view/create/edit salary with a confirmation step before updates.

> Dashboard: total payroll, average salary, table by country—wire to the summary API.

### 5. Quality pass

> Add centralized API errors, max page size, SQL aggregates for dashboard (avoid loading 10k rows in memory), abort stale fetches on the client, then README and deployment notes.

## Data note (important for reviewers)

- **Employee and salary records are synthetic**, produced by `apps/api/prisma/seed.ts` and `seed-data.ts`.
- Numbers and names are **not** from a real company; they exist to demonstrate list performance, filters, and payroll aggregation at scale.

## What I did not delegate

- Final say on architecture (monorepo, domain-first API, server-side pagination)
- Security posture awareness (no auth in Phase 1—documented as out of scope)
- Commit order and TDD discipline (tests before implementation per module)
- Manual verification: `npm test`, local run of API + web, seed on a fresh DB

## Tooling

- **Editor:** Cursor with built-in agent
- **No** separate “generate entire app” service; iterative prompts with review between steps

---

*If your process requires more detail (e.g. full prompt history), I can provide it separately. This file summarizes how AI supported the assignment without claiming the submission was fully automated.*
