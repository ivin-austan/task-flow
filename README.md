# Taskflow

Taskflow is a full-stack task manager. The React + TypeScript frontend uses TanStack Query for API/server state and Zustand for UI state. An Express + TypeScript API validates requests with Zod and persists tasks through Prisma to PostgreSQL.

## Requirements

- Node.js 22.18+ or 24.11+ (Node 26+ is also supported)
- PostgreSQL 15+
- npm

The application uses Prisma ORM 8 only. Its data contract is [server/src/prisma/contract.prisma](./server/src/prisma/contract.prisma), and the single migration history is stored under `migrations/app/`. Prisma 8 is currently installed at release-candidate versions (`prisma@8.0.0-rc.29` and `@prisma/orm-postgres@8.0.0-rc.21`); the runtime is pinned to `rc.21` because `rc.22` failed contract emission with this CLI.

## Local setup

1. Install packages, then configure the database connection:

   ```sh
   npm install
   ```

   Copy `.env.example` to `.env`. Set `DATABASE_URL` to your PostgreSQL username, password, host, port, and database. Do not commit `.env`.

   ```text
   DATABASE_URL="postgresql://<user>:<password>@localhost:6000/task_manager?schema=public"
   ```

   Create the `task_manager` database first if it does not exist. Update the port to match your PostgreSQL configuration.

   Set `LEGACY_TASK_OWNER_EMAIL` to the email address that should own existing tasks. The API assigns unowned existing tasks to that address at startup. Sign up to Taskflow with the same address and verify it to access those tasks.

   Account verification and email alerts use SMTP. Set `SMTP_USER` to your Gmail address and `SMTP_PASSWORD` to a Google app password. Keep these values only in `.env` or your API host's secret settings. For Gmail, enable 2-Step Verification and create an app password in your Google Account security settings; do not use your regular Gmail password. Set `ALERT_TIMEZONE` to your IANA timezone (for example, `America/New_York`). Alerts go to each task owner's verified email: due-date reminders start at 9 a.m. in that timezone, overdue reminders are hourly, and completion messages are immediate. The API must be running to send scheduled alerts.

2. Emit the Prisma 8 contract artifacts, apply the committed migrations, and insert sample tasks into an empty database:

   ```sh
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

   The seed script does nothing when the database already contains tasks. Keep `LEGACY_TASK_OWNER_EMAIL` set before starting the API so existing tasks are assigned to the intended account.

3. Start the API and frontend in separate terminals:

   ```sh
   npm run dev:api
   ```

   ```sh
   npm run dev
   ```

   Vite proxies `/api` requests to `http://localhost:4000`. The API listens on port `4000` by default.

## Useful commands

| Command | Purpose |
|---|---|
| `npm run db:generate` | Emit Prisma 8 runtime and type artifacts from the contract |
| `npm run db:plan -- --name <slug>` | Plan a migration from contract changes |
| `npm run db:migrate` | Apply pending committed Prisma 8 migrations |
| `npm run db:deploy` | Apply pending migrations in deployment |
| `npm run db:seed` | Seed sample tasks into an empty database |
| `npm run dev:api` | Run the API with watch mode |
| `npm run dev` | Run the Vite frontend |
| `npm run build` | Type-check and build frontend and backend |
| `npm run start:api` | Run the compiled API |
| `npm run lint` | Lint the project |

## Production deployment

The frontend uses `VITE_API_URL` as the API origin. Set it in the frontend host's build environment to the deployed API origin, for example `https://your-api.onrender.com` (no trailing slash), then rebuild and redeploy the frontend. Leave it empty for local development, where Vite proxies `/api` to `http://localhost:4000`.

Set `CLIENT_ORIGIN` on the API host to the exact deployed frontend origin, such as `https://your-site.netlify.app`, so the API allows credentialed browser requests from that site. Set `DATABASE_URL`, `LEGACY_TASK_OWNER_EMAIL`, `SMTP_USER`, `SMTP_PASSWORD`, and `ALERT_TIMEZONE` on the API host. These are backend settings and do not belong in frontend environment settings. Apply database migrations with `npm run db:deploy` before starting the updated API.

The API uses a seven-day HttpOnly session cookie. Email/password accounts require a verified email before sign-in; passwords must be at least 8 characters. Task lists, task details, mutations, dashboard totals, and alerts are scoped to the signed-in, verified email. If you have existing tasks, ensure the legacy owner email matches the account you verify.

Build before running the compiled API:

```sh
npm run build
npm run start:api
```

## Project guides

- [API documentation](./docs/API_DOCUMENTATION.md)
- [Architecture](./docs/PROJECT_ARCHITECTURE.md)
- [TypeScript learning notes](./docs/TYPESCRIPT_LEARNING_NOTES.md)

Task and dashboard endpoints require a verified account. Configure trusted local database and SMTP settings in `.env`; credentials are never sent to the browser.
