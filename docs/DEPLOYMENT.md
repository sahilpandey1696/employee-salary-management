# Deployment

## Components

| Service | Default port | Build output |
|---------|--------------|--------------|
| API | 3001 | Node runs `apps/api/src/server.ts` |
| Web | 3000 | `next build` → `.next` standalone or Node host |

## Pre-deploy checklist

1. Set `NODE_ENV=production`.
2. Point `DATABASE_URL` to a persistent database (PostgreSQL recommended for production).
3. Run `npm run db:generate && npm run db:migrate` against production.
4. Run seed once if starting fresh: `npm run db:seed` (or use a managed migration pipeline).
5. Set `API_URL` on the web host to the public API origin.
6. Enable HTTPS termination at the load balancer or reverse proxy.

## API deployment

```bash
cd apps/api
npm run db:generate
npm run db:migrate
# optional first-time seed
npm run db:seed

PORT=3001 DATABASE_URL="file:./prisma/prod.db" node --import tsx src/server.ts
```

For production, compile TypeScript or use `tsx` behind a process manager (systemd, PM2, or container entrypoint).

### PostgreSQL migration

1. Change `provider` in `prisma/schema.prisma` to `postgresql`.
2. Set `DATABASE_URL` to your Postgres connection string.
3. Run `prisma migrate deploy`.
4. Re-run seed or migrate data from SQLite export.

## Web deployment

```bash
cd apps/web
API_URL=https://api.example.com npm run build
npm run start
```

Next.js rewrites `/api/*` to `API_URL` at build time for the configured origin. Rebuild when the API URL changes.

### Vercel + separate API

1. Deploy API to a Node host (Railway, Fly.io, ECS, etc.).
2. Set `API_URL` in Vercel project environment variables.
3. Deploy the `apps/web` directory or monorepo with root directory `apps/web`.

## Health verification

After deploy:

```bash
curl https://api.example.com/dashboard/summary
curl "https://api.example.com/employees?page=1&pageSize=5"
```

## Observability (recommended)

- Structured logging around HTTP 5xx (no stack traces in responses).
- DB connection pool metrics if using Postgres.
- Rate limiting on public API once auth is added.

## Security

Phase 1 has **no authentication**. Do not expose the API to the public internet without:

- HR SSO / session auth
- Network restrictions (VPN, private subnet)
- Audit logging for salary changes
