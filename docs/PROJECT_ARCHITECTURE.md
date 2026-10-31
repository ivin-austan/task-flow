# Project Architecture

## Overview

```text
React UI
  ├─ TanStack Query: task lists, task details, dashboard, mutations/cache
  └─ Zustand: navigation, filter controls, selected modal/task ID
       │ same-origin /api requests
       ▼
Express API
  Routes → Zod validation → Controllers → Task service → Prisma Client
                                                        │
                                                        ▼
                                                   PostgreSQL
```

The Vite development server proxies `/api` to the Express API. The browser never connects directly to Prisma or PostgreSQL. There is no backend auth yet.

## Folders

```text
src/
  components/       Layout, dashboard, and task UI
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
    middleware/     Validation and centralized errors
    routes/         REST endpoint registration
    services/       Database-backed task logic and mapping
    types/          Server API output and query types
    validators/     Zod request schemas
    utils/          Express async and response helpers
docs/               API, architecture, and TypeScript guides
```

## Request and response lifecycle

1. A page invokes a typed TanStack Query hook, whose key includes the request filters or task ID.
2. The API service uses `fetch` and validates the JSON response with Zod before exposing it as a frontend type.
3. Express routes validate incoming params, query, and body values with Zod before calling a controller.
4. Controllers coordinate the response; `server/src/services/task.service.ts` performs typed Prisma operations.
5. Prisma queries PostgreSQL. The server maps generated Prisma enums/date values into a separate lower-case, JSON-friendly API DTO.
6. Query data is cached by TanStack Query. Successful create/update/delete mutations invalidate affected task-list and dashboard keys; update also refreshes the selected task detail cache.

## State ownership

- **Server state:** Tasks, task details, and dashboard aggregates originate from PostgreSQL. TanStack Query owns the cache, loading/error state, refetch, and mutation lifecycle.
- **Client state:** Active navigation, filters/page controls, and selected modal/task ID live in `src/store/ui.store.ts`.
- Avoid copying the server task collection into Zustand. Duplicated sources of truth can drift after mutations or refetches.
- In a frontend-only implementation localStorage was sufficient. After this upgrade, localStorage is no longer used for task persistence.

## Prisma and database model

`server/src/prisma/contract.prisma` is the single source of truth for the Task model: PostgreSQL-generated UUID, title/description, status/priority enums, optional `DATE` due date, timestamps, and indexes for status/priority, due date, and creation date. Prisma 8 derives runtime types and contract artifacts from this file. The only migration history is under root `migrations/app/`, initially planned from an empty deployment database. The API and seed script use the Prisma 8 PostgreSQL runtime; no Prisma 7 client, config, schema, or migration history is retained. The Prisma CLI (`8.0.0-rc.29`) and PostgreSQL runtime (`8.0.0-rc.21`) are separately versioned prereleases; runtime `rc.21` is pinned because `rc.22` failed contract emission with this CLI.

`DATABASE_URL` is read only by the backend and Prisma CLI. `.env.example` documents the format without credentials. The frontend receives neither the URL nor database credentials.

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
