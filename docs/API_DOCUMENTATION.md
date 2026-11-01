# Task API

Base URL: `/api`. During development, Vite forwards these requests to `http://localhost:4000`.

Successful responses use `{ "data": ... }`. Paginated task lists also include `meta`. Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [{ "path": "title", "message": "Too small: expected string to have >=1 characters" }]
  }
}
```

## Authentication

The API supports open email/password registration. Passwords must be at least
8 characters and at most 128 characters. Registration sends a verification
link that expires after 30 minutes. SMTP must be configured on the API to
register or verify accounts. Sign-in sets an HttpOnly session cookie that
expires after seven days. The browser must send credentialed requests from the
configured `CLIENT_ORIGIN`. Task routes require a verified session and only
expose tasks owned by the signed-in email.

### `POST /api/auth/register`

```json
{ "email": "you@example.com", "password": "at-least-8-characters" }
```

- **202** — generic message indicating a verification email may have been sent
- **400** — invalid email or password
- **503** — email delivery is unavailable

### `POST /api/auth/verify`

Accepts the one-time token included in the verification link:

```json
{ "token": "verification-token" }
```

- **200** — email verified
- **400** — token is invalid or expired

### `POST /api/auth/login`

Accepts `{ "email": "...", "password": "..." }`. Returns the verified user and
sets the session cookie.

- **200** — signed in
- **400** — invalid request
- **401** — invalid credentials
- **403** — email is not verified
- **429** — too many account requests

### `GET /api/auth/me`

Returns the current signed-in user. **401** if there is no valid session.

### `POST /api/auth/logout`

Revokes the current session and clears the cookie. Requires the trusted
frontend origin.

## Task ownership

Every task endpoint requires a verified session. Tasks created in the API are
assigned to the signed-in email; list, detail, update, delete, and dashboard
queries only include that email's tasks. Requests for another owner's task
return **404**. Existing tasks receive the configured
`LEGACY_TASK_OWNER_EMAIL` at API startup while their owner is unset.

## `GET /api/health`

Checks that the API can reach PostgreSQL.

**200**

```json
{ "data": { "status": "ok" } }
```

## `GET /api/tasks`

Returns a server-filtered, sorted page of tasks.

| Query | Type | Default | Rules |
|---|---|---:|---|
| `page` | integer | `1` | At least 1 |
| `pageSize` | integer | `10` | 1–100 |
| `search` | string | empty | Searches title, max 120 characters |
| `status` | enum | — | `todo`, `in-progress`, `completed` |
| `priority` | enum | — | `low`, `medium`, `high` |
| `overdueOnly` | boolean | `false` | Excludes completed tasks |
| `sortBy` | enum | `createdAt` | `createdAt`, `dueDate` |
| `sortOrder` | enum | `desc` | `asc`, `desc` |

Example:

```http
GET /api/tasks?page=1&pageSize=10&status=in-progress&sortBy=dueDate&sortOrder=asc
```

**200**

```json
{
  "data": [
    {
      "id": "a9be0ceb-6123-4f91-a35c-d4d09a8f3c51",
      "title": "Plan the product roadmap",
      "description": "Review quarterly goals.",
      "status": "in-progress",
      "priority": "high",
      "dueDate": "2026-11-02",
      "createdAt": "2026-10-25T09:00:00.000Z",
      "updatedAt": "2026-10-28T13:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 1, "totalPages": 1 }
}
```

## `GET /api/tasks/dashboard`

Returns database-aggregated dashboard totals.

**200**

```json
{
  "data": {
    "total": 4,
    "completed": 1,
    "pending": 2,
    "inProgress": 1,
    "highPriority": 2,
    "completionPercent": 25,
    "byStatus": { "todo": 2, "in-progress": 1, "completed": 1 }
  }
}
```

## `GET /api/tasks/:id`

Returns one UUID-identified task.

- **200** — `{ "data": Task }`
- **400** — path ID is not a valid UUID
- **404** — task does not exist

## `POST /api/tasks`

Creates a task. `title` is required and trimmed (1–120 characters). `description` is optional (up to 1000 characters). `status` and `priority` are optional and default to `todo` and `medium`. `dueDate`, when present, must be a real calendar date in `YYYY-MM-DD` form.

```json
{
  "title": "Prepare weekly report",
  "description": "Summarize project updates.",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2026-11-05"
}
```

- **201** — `{ "data": Task }`
- **400** — invalid body

The database creates the UUID and timestamps.

## `PATCH /api/tasks/:id`

Updates only provided editable fields. At least one field is required. Send `null` for `description` or `dueDate` to clear it.

```json
{ "status": "completed", "dueDate": null }
```

- **200** — `{ "data": Task }`
- **400** — invalid path or body
- **404** — task does not exist

## `DELETE /api/tasks/:id`

- **204** — task was deleted; response has no body
- **400** — invalid path ID
- **404** — task does not exist

## Error status codes

| Status | Meaning |
|---:|---|
| 400 | Invalid JSON, query, path, or request body |
| 404 | Unknown route or task ID |
| 413 | Request exceeds the 32 KB JSON limit |
| 500 | Unexpected server/database failure; internal details are not returned |

No endpoint exposes Prisma records directly; database enums and dates are converted to the frontend API contract.
