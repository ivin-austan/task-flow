# Taskflow Project Guide

## Architecture

Taskflow is a full-stack task manager. The browser runs a React and TypeScript
single-page application; an Express and TypeScript API owns task operations;
PostgreSQL is the source of truth, accessed through the Prisma 8 PostgreSQL
runtime.

```text
React UI
  ├─ TanStack Query: task lists, details, dashboard, mutations, cache
  └─ Zustand: navigation, filters, selected task/modal UI state
       │ fetch /api requests
       ▼
Express API
  Auth routes → verified email/password → HttpOnly session cookie
  Task routes → auth + Zod → Controllers → Services → Prisma runtime
       │                                           │
       ├─ Health endpoint                          ▼
       └─ Email alert scheduler ─────────────── PostgreSQL
                  └─ Gmail-compatible SMTP → task owner's email
```

In development, Vite proxies `/api` to the API on port 4000. The browser must
never connect directly to PostgreSQL or receive database/SMTP credentials.
Task routes require a verified account and are scoped to that account's email.

## Frontend

- `src/main.tsx` creates the React root and configures the TanStack Query
  provider. `src/App.tsx` composes the application.
- `src/pages/` and `src/components/` render pages, layout, dashboard, and task
  UI.
- `src/hooks/queries/` and `src/hooks/mutations/` own server-state interactions
  and query-cache invalidation. `src/hooks/queries/task.keys.ts` defines cache
  keys.
- `src/services/task.api.ts` calls the API through `src/services/api.client.ts`
  and validates responses with Zod schemas in `src/schemas/`.
- `src/services/auth.api.ts` handles registration, email verification,
  sign-in, session checks, and sign-out. Authentication uses HttpOnly cookies;
  include credentials on API requests and never persist session tokens in
  browser storage.
- `src/store/ui.store.ts` owns transient UI state only. Do not copy the task
  collection into Zustand or local storage.
- `src/types/` describes the browser-facing API/domain types. Keep these
  separate from generated database and server request types.
- `VITE_API_URL` selects the API origin for frontend builds. Leave it empty for
  local development, where Vite's `/api` proxy is used.

## Backend request and data flow

1. `server/src/app.ts` configures Express, Helmet, credentialed CORS, JSON parsing, the
   database-backed health endpoint, task routes, and final error handlers.
2. Task routes authenticate the user and require trusted origin for
   state-changing requests.
3. `server/src/routes/` maps HTTP routes to handlers.
4. `server/src/middleware/validation.middleware.ts` parses route input using
   Zod schemas from `server/src/validators/`.
5. `server/src/controllers/` translates validated requests into responses.
6. `server/src/services/` contains account/session handling, owner-scoped task
   persistence/mapping, and optional email delivery/scheduling behavior.
7. `server/src/prisma/db.ts` initializes the database runtime. Keep direct
   database queries in server-side services, not controllers or the browser.
8. `server/src/types/` describes API output. `server/src/middleware/` returns
   the stable API error shape and handles invalid requests.

The API is mounted at `/api`; task routes use `/api/tasks`. The task service
maps database enum values to the lower-case API status and priority values and
keeps database-specific representations out of the frontend. Every task query
and mutation must be scoped to the authenticated user's verified email.
Update request
validation, server types, API documentation, frontend schemas/types, and UI
consumers together when changing a public response or request shape.

Task lists are filtered, sorted, and paginated by the API/database. Dashboard
totals are database aggregates. Successful frontend mutations invalidate
affected TanStack Query task and dashboard caches.

## Persistence and migrations

- `server/src/prisma/contract.prisma` is the authoritative database contract.
- `server/src/prisma/contract.d.ts` and `contract.json` are generated; do not
  edit them manually. `npm run db:generate` regenerates them.
- Committed migration history lives in `migrations/app/`. Change the contract,
  plan and review a migration with `npm run db:plan -- --name <slug>`, then
  commit the resulting migration with the contract change. Do not replace or
  bypass the established Prisma 8 migration history.
- `DATABASE_URL` is backend/CLI-only. `npm run db:seed` loads optional sample
  tasks only when the task table is empty.

## Email alerts

The API optionally scans for due tasks while the API process is running. It
sends a due-date alert after 9 a.m. in `ALERT_TIMEZONE`, repeats overdue alerts
hourly, and sends a completion alert when a task transitions to completed.
Delivery uses SMTP; Gmail is the documented default. Configure `SMTP_USER`
and `SMTP_PASSWORD` only in the backend's private `.env` or deployment
secrets. Alerts go to the task owner's verified email. `SMTP_HOST`,
`SMTP_PORT`, and `ALERT_TIMEZONE` customize the transport and schedule. Email
verification and alerts require SMTP settings. Never add personal addresses,
app passwords, SMTP credentials, or other secrets to source, frontend
variables, logs, or commits.

Passwords are hashed with scrypt. Verification links are one-time and expire
after 30 minutes; session tokens are random, stored hashed in PostgreSQL, and
sent only as HttpOnly cookies. Preserve trusted-origin checks for cookie-backed
state-changing requests. `LEGACY_TASK_OWNER_EMAIL` assigns unowned pre-account
tasks at API startup to the chosen existing account.

The in-process scheduler is not a durable job queue: its alert delivery state
is lost on API restart, and it does not run while the API is stopped. Account
for this if changing deployment topology or alert guarantees.

## Configuration and security boundaries

- `.env.example` contains placeholders only. `.env` is ignored by Git.
- `DATABASE_URL`, `LEGACY_TASK_OWNER_EMAIL`, SMTP settings, `PORT`, and
  `CLIENT_ORIGIN` are backend settings. `VITE_API_URL` is public frontend build
  configuration; never put secrets in `VITE_*` variables.
- The API currently allows the configured `CLIENT_ORIGIN`; preserve this
  boundary when changing CORS.
- Validate all external API input. Keep database internals and SMTP credentials
  out of client-visible responses and production error messages.

## Build, run, and documentation

Use the scripts in `package.json`:

| Command | Purpose |
|---|---|
| `npm run dev` | Run the Vite frontend |
| `npm run dev:api` | Run the API in watch mode |
| `npm run build` | Generate Prisma contract artifacts, type-check, and build frontend/API |
| `npm run lint` | Lint the project |
| `npm run db:generate` | Generate Prisma contract artifacts |
| `npm run db:plan -- --name <slug>` | Plan a database migration |
| `npm run db:migrate` | Apply local pending migrations |
| `npm run db:deploy` | Apply migrations for deployment |
| `npm run db:seed` | Seed an empty task table |
| `npm run start:api` | Run the compiled API |

Run the frontend and API in separate terminals for local development. Set
`DATABASE_URL` in the backend environment before starting the API.

For detailed architecture, API contracts, local setup, and deployment guidance,
see [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md),
[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md), and
[README.md](README.md). Update the relevant documentation when changing
architecture, behavior, or configuration.
