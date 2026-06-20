# Manager

A mobile-first Coaching Management SaaS for teachers to manage classes, students, attendance, and homework.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, serves at /api)
- `pnpm --filter @workspace/manager-app run dev` — run the frontend (port 5000, serves at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + Tailwind CSS + shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/index.ts` — Database schema (classes, students, attendance, homework)
- `artifacts/manager-app/src/pages/` — Frontend pages (login, dashboard, class-detail, attendance, homework)
- `artifacts/manager-app/src/components/layout/` — App layout, header, bottom nav
- `artifacts/api-server/src/routes/` — API route handlers (classes, students, attendance, homework, dashboard)

## Architecture decisions

- All data filtered by `teacher_id = "default-teacher"` (ready to extend with real Supabase Auth)
- Attendance stored as text date strings (YYYY-MM-DD) for simple querying
- Dashboard aggregates (summary, today's attendance, recent homework) are computed server-side
- UUIDs generated via `crypto.randomUUID()` for all primary keys
- Frontend uses Bengali Google Font "Hind Siliguri" for the "Manager" brand name only

## Product

- **Login**: Email/password login screen (UI-only, redirects to dashboard on submit)
- **Dashboard**: Teacher stats, class cards, today's attendance summary, recent homework feed
- **Class Detail**: Per-class student list, add/delete students, homework tab with history
- **Attendance**: Select class, toggle present/absent per student, save to DB
- **Homework**: Select class, assign new homework (subject + content), browse history

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Frontend workflow must use port 5000 (updated artifact.toml from default 19752 to 5000)
- Run `pnpm run typecheck:libs` after changing any `lib/*` schema before checking artifact typechecks
- When using `enabled` in hook options, always also pass `queryKey` — required by the generated hooks

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
