# Taskflow

Taskflow is a full-stack task manager. The React + TypeScript frontend uses TanStack Query for API/server state and Zustand for UI state. An Express + TypeScript API validates requests with Zod and persists tasks through Prisma to PostgreSQL.

## Requirements

- Node.js 22.18+ or 24.11+ (Node 26+ is also supported)
- PostgreSQL 15+
- npm

The project is being migrated incrementally: Prisma ORM 8 CLI `8.0.0-rc.29` and PostgreSQL runtime `8.0.0-rc.21` are installed alongside the Prisma ORM 7 application. The runtime is pinned to `rc.21` because the latest `rc.22` failed contract emission with this CLI. The current API and database migrations still use Prisma 7 while the Prisma 8 contract is emitted from the existing schema. Prisma 8 packages are prereleases and are not recommended for production.

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

2. Generate Prisma Client, apply the migration, and insert sample tasks into an empty database:

   ```sh
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

   The seed script does nothing when the database already contains tasks.

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
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:deploy` | Apply committed migrations in deployment |
| `npm run db:seed` | Seed sample tasks into an empty database |
| `npm run db8:emit` | Emit Prisma 8 contract artifacts from the existing schema |
| `npm run dev:api` | Run the API with watch mode |
| `npm run dev` | Run the Vite frontend |
| `npm run build` | Type-check and build frontend and backend |
| `npm run start:api` | Run the compiled API |
| `npm run lint` | Lint the project |

Build before running the compiled API:

```sh
npm run build
npm run start:api
```

## Project guides

- [API documentation](./docs/API_DOCUMENTATION.md)
- [Architecture](./docs/PROJECT_ARCHITECTURE.md)
- [TypeScript learning notes](./docs/TYPESCRIPT_LEARNING_NOTES.md)

The API still uses the Prisma 7 client during this migration phase. The app does not currently implement authentication. Configure trusted local database credentials in `.env`; database credentials are never sent to the browser.
