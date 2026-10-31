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

2. Emit the Prisma 8 contract artifacts, apply the committed migration, and insert sample tasks into an empty database:

   ```sh
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

   The seed script does nothing when the database already contains tasks. The committed initial migration was planned from an empty database.

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

Set `CLIENT_ORIGIN` on the API host to the exact deployed frontend origin, such as `https://your-site.netlify.app`, so the API allows browser requests from that site. Set `DATABASE_URL` on the API host to the hosted PostgreSQL connection string. Neither backend variable belongs in frontend environment settings.

Build before running the compiled API:

```sh
npm run build
npm run start:api
```

## Project guides

- [API documentation](./docs/API_DOCUMENTATION.md)
- [Architecture](./docs/PROJECT_ARCHITECTURE.md)
- [TypeScript learning notes](./docs/TYPESCRIPT_LEARNING_NOTES.md)

The app does not currently implement authentication. Configure trusted local database credentials in `.env`; database credentials are never sent to the browser.
