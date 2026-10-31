# Project Architecture

## Overview

```text
React UI
  ├─ TanStack Query: task lists, task details, dashboard, mutations/cache
  └─ Zustand: navigation, filter controls, selected modal/task ID
       │ credentialed /api requests
       ▼
Express API
  Auth routes → verified email/password → HttpOnly session cookie
  Task routes → auth + Zod → controllers → task service → Prisma runtime
                                                        │
                                                        └─ PostgreSQL
  Email alert scheduler ── Gmail-compatible SMTP ── task owner
```

The Vite development server proxies `/api` to the Express API. The browser never connects directly to Prisma or PostgreSQL. Task routes require a verified account and are scoped by the signed-in user's email.

## Folders

```text
src/
  components/       Layout, dashboard, task UI, and account UI
  data/tasks.json   Optional first-run seed records
  hooks/
    queries/        TanStack Query read hooks and query keys
    mutations/      Typed API mutation hooks and cache invalidation
  pages/            Dashboard composition
  schemas/          Runtime schemas for API responses
  services/         Browser API client and task API calls
  store/ui.store.ts Zustand-only UI state
  types/            Frontend API/domain contracts
  utils/            Small presentation utilities
server/
  src/
    prisma/         Prisma 8 contract, runtime client, and seed script
    controllers/    HTTP request/response orchestration
    middleware/     Authentication, validation, and centralized errors
    routes/         REST endpoint registration
    services/       Account, task, and email delivery/scheduling logic
    types/          Server API output and query types
    validators/     Zod request schemas
    utils/          Express async and response helpers
docs/               API, architecture, and TypeScript guides
```

## Request and response lifecycle

1. A page invokes a typed TanStack Query hook, whose key includes the request filters or task ID.
2. The API service uses `fetch` and validates the JSON response with Zod before exposing it as a frontend type.
3. Task routes authenticate the user using a hashed opaque session token in an HttpOnly cookie. State-changing browser requests must use the configured trusted origin.
4. Express routes validate incoming params, query, and body values with Zod before calling a controller.
5. Controllers coordinate the response; server services perform typed Prisma operations.
6. Prisma queries PostgreSQL. The server maps generated enums/date values into a separate lower-case, JSON-friendly API DTO.
7. Query data is cached by TanStack Query. Successful create/update/delete mutations invalidate affected task-list and dashboard keys; update also refreshes the selected task detail cache.

## State ownership

- **Server state:** Accounts, owned tasks, task details, and dashboard aggregates originate from PostgreSQL. TanStack Query owns the task cache, loading/error state, refetch, and mutation lifecycle.
- **Client state:** Active navigation, filters/page controls, and selected modal/task ID live in `src/store/ui.store.ts`.
- Avoid copying the server task collection into Zustand. Duplicated sources of truth can drift after mutations or refetches.
- In a frontend-only implementation localStorage was sufficient. After this upgrade, localStorage is no longer used for task persistence.

## Prisma and database model

`server/src/prisma/contract.prisma` is the single source of truth for User, AuthSession, and Task models. Each task records its owner's verified email; task queries and mutations are scoped to that email. Prisma 8 derives runtime types and contract artifacts from this file. The migration history is under root `migrations/app/`. The API and seed script use the Prisma 8 PostgreSQL runtime; no Prisma 7 client, config, schema, or migration history is retained. The Prisma CLI (`8.0.0-rc.29`) and PostgreSQL runtime (`8.0.0-rc.21`) are separately versioned prereleases; runtime `rc.21` is pinned because `rc.22` failed contract emission with this CLI.

`DATABASE_URL` is read only by the backend and Prisma CLI. `.env.example` documents the format without credentials. The frontend receives neither the URL nor database credentials.

Passwords are hashed with Node.js scrypt. Account verification uses one-time hashed tokens that expire after 30 minutes. Sessions use random opaque tokens whose hashes are stored in PostgreSQL and are delivered only through HttpOnly cookies. `LEGACY_TASK_OWNER_EMAIL` assigns unowned existing tasks at API startup to the chosen account.

The API's optional email alert scheduler checks owned due tasks while the API is running. It sends due-date reminders after 9 a.m. in `ALERT_TIMEZONE`, overdue reminders once per hour, and completion messages on status transitions to the task owner's verified email. SMTP credentials are backend-only environment settings; no recipient address is hard-coded.

## Validation and errors

- Zod request schemas validate route params, query values, date strings, and create/update bodies.
- Validation middleware passes inferred parsed values to controller functions.
- The task service maps contract enum values and translates missing records into a domain not-found error.
- Central error middleware returns a stable `{ error: { code, message, details? } }` shape. Stack traces/database details are only logged outside production, never returned to the browser.
- Helmet, a configured CORS origin, disabled `x-powered-by`, and a 32 KB JSON body limit are set in `server/src/app.ts`.

## Seed lifecycle

`src/data/tasks.json` is optional sample data, not a live database. `npm run db:seed` validates it and inserts records only when the Task table is empty. The JSON is never rewritten by task changes and does not replace PostgreSQL.

## Important decisions

- Frontend, server request schemas, Prisma-generated models, and API DTOs remain separate. This prevents database-specific enum and date representations from leaking into the UI.
- Dashboard stats use Prisma 8 aggregate counts rather than downloading every task to calculate totals in the browser.
- List filtering, sorting, and pagination run in SQL. Query keys include the filters so each result page is cached separately.
- API calls use native `fetch`; no extra HTTP client was necessary.
