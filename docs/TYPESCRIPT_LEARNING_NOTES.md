# TypeScript Learning Notes

Examples below refer to the current full-stack implementation.

## Interfaces and type aliases

- **What:** Interfaces describe object contracts. Type aliases can describe objects, unions, intersections, and utility-type results.
- **Why:** `Task` and component/store contracts are object shapes. Status values and composed inputs are aliases.
- **Where:** Frontend [`src/types/task.types.ts`](../src/types/task.types.ts), backend [`server/src/types/task.types.ts`](../server/src/types/task.types.ts).
- **Example:** `interface Task { id: string; title: string; status: TaskStatus }`.
- **Prevents:** Missing fields and inconsistent contracts at compile time.
- **Alternative:** Either syntax can describe an object; interfaces are convenient for extensible object contracts and aliases for type composition.

## Union and literal types

- **What:** A union lists the finite values a field may contain.
- **Why:** Only known task states and priorities should cross the API boundary.
- **Where:** `TaskStatus` and `TaskPriority` in `src/types/task.types.ts`; corresponding Zod schemas are in `server/src/validators/task.validator.ts`.
- **Example:** `type TaskPriority = "low" | "medium" | "high"`.
- **Prevents:** Invalid status strings from propagating into UI logic.
- **Alternative:** Prisma enums enforce values in the database; TypeScript unions provide the JSON-facing contract without exposing enum implementation details.

## Intersection types

- **What:** `A & B` combines the requirements of two types.
- **Why:** Update mutation variables combine task identity with a partial edit payload without redefining either.
- **Where:** `UpdateTaskVariables` in [`src/hooks/mutations/useUpdateTask.ts`](../src/hooks/mutations/useUpdateTask.ts).
- **Example:** `type UpdateTaskVariables = Pick<Task, "id"> & { changes: UpdateTaskInput }`.
- **Prevents:** The update identifier and changes becoming an untyped positional argument pair.
- **Alternative:** An interface can extend both object contracts. The alias is concise for a one-off composition.

## Optional and readonly properties

- **What:** `?` allows a value to omit a property; `readonly` prevents reassignment through that type.
- **Why:** Description and due date can be omitted. A task identifier remains stable after database creation.
- **Where:** `Task` in `src/types/task.types.ts`.
- **Example:** `readonly id: string; description?: string`.
- **Prevents:** Accidental identity changes and forcing optional form fields to be present.
- **Alternative:** Explicit `string | undefined` still requires a property. `readonly` is compile-time only; PostgreSQL constraints enforce data rules at runtime.

## `Omit`, `Pick`, `Partial`, and `Record`

- **What:** Utility types select, remove, or make properties optional; `Record` maps a key union to values.
- **Why:** Create requests exclude database-owned fields; update requests only include editable keys; status counts are complete mappings.
- **Where:** `src/types/task.types.ts`, dashboard components, backend `DashboardStatistics`.
- **Example:** `CreateTaskInput = Omit<Task, "id" | "createdAt" | "updatedAt">`; `UpdateTaskInput = Partial<...>`.
- **Prevents:** Repeating the Task property list and allowing users to submit timestamps or IDs.
- **Alternative:** Handwritten input interfaces work, but can drift from `Task`. `Record<TaskStatus, number>` ensures all statuses have counts.

## Generics

- **What:** A generic parameter carries a type through a reusable function or library API.
- **Why:** Validation middleware preserves the value inferred from each Zod schema, while Zustand and React Query keep their state/data types.
- **Where:** [`server/src/middleware/validation.middleware.ts`](../server/src/middleware/validation.middleware.ts), `create<UiStore>` in `src/store/ui.store.ts`, and query/mutation hooks.
- **Example:** `function validate<TSchema extends z.ZodType>(schema: TSchema, ...): RequestHandler` uses `z.infer<TSchema>` for the parsed handler value.
- **Prevents:** Falling back to `any` and losing the connection between a validator and its parsed data.
- **Alternative:** One handler per request schema is simpler for very small APIs but repeats middleware logic.

## Zod inference and type narrowing

- **What:** Zod validates values at runtime and can infer a static type from the schema. Type narrowing checks an unknown value before using it.
- **Why:** HTTP bodies, query strings, and JSON responses are untrusted runtime data; TypeScript types alone are erased.
- **Where:** `server/src/validators/task.validator.ts`, `src/schemas/task.schema.ts`, and `src/services/api.client.ts`.
- **Example:** `const value = await schema.parseAsync(input)` validates before the controller receives the inferred type. API responses are first `unknown`, then `taskPageResponseSchema.parse(...)` validates their shape.
- **Prevents:** Malformed dates, UUIDs, status values, and response fields from being trusted only because of a type annotation.
- **Alternative:** Manual guards are possible, but schemas keep validation rules together and provide structured issues.

## Frontend API DTOs versus Prisma-generated types

- **What:** Prisma Client generates types from the database schema; a DTO is the API-facing shape returned to the browser.
- **Why:** PostgreSQL enums are uppercase and database dates are `Date` objects, while the frontend uses lowercase strings and ISO/date-only strings.
- **Where:** Generated `Task`/enum types are consumed in `server/src/services/task.service.ts`; mapping to `TaskDto` happens there. Browser contracts are in `src/types/task.types.ts`.
- **Example:** `Record<TaskStatus, TaskDto["status"]>` maps `TaskStatus.IN_PROGRESS` to `"in-progress"`.
- **Prevents:** Leaking Prisma-specific types and runtime formats into React.
- **Alternative:** Returning generated Prisma records directly couples the client to database changes; separate DTOs create a stable API contract.

## Typed Express requests and responses

- **What:** Express provides `Request`, `Response`, `NextFunction`, and `RequestHandler` types.
- **Why:** Controllers and validation middleware have explicit inputs and outputs, and errors can be forwarded consistently.
- **Where:** `server/src/controllers/task.controller.ts` and `server/src/middleware`.
- **Example:** `Response` sends the JSON envelope; `NextFunction` sends async failures into centralized error middleware.
- **Prevents:** Incorrect handler signatures and ad hoc error response behavior.
- **Alternative:** Inferring inline callback parameters can be adequate, but named controller contracts are easier to maintain.

## Async functions and `Promise`

- **What:** An `async` function returns a `Promise<T>` that resolves to `T` or rejects with an error.
- **Why:** PostgreSQL/Prisma queries and browser HTTP requests are asynchronous.
- **Where:** `server/src/services/task.service.ts`, `src/services/task.api.ts`, and TanStack Query hooks.
- **Example:** `async function fetchTasks(...): Promise<TaskPageData>`.
- **Prevents:** Treating pending database/network results as immediately available.
- **Alternative:** Callback APIs exist, but promises integrate with `await`, Express async handlers, and query/mutation lifecycle.

## Unknown, API errors, and safe handling

- **What:** `unknown` allows any runtime value but requires narrowing before operations; `any` disables those checks.
- **Why:** Fetch JSON and caught errors have no trustworthy static shape until validated.
- **Where:** `src/services/api.client.ts` and `server/src/middleware/error.middleware.ts`.
- **Example:** API response bodies are held as `unknown`; Zod identifies the error envelope before its message is read.
- **Prevents:** Unsafe assumptions about network failures or database errors, and accidental exposure of internal error details.
- **Alternative:** `any` is appropriate only at an isolated boundary where validation immediately follows; this implementation keeps values `unknown`.

## React props and React Hook Form

- **What:** Props type component inputs/callbacks; React Hook Form infers form values from a Zod schema and provides typed handlers.
- **Why:** Forms need validated values and reusable callbacks without duplicating validation logic.
- **Where:** `src/components/tasks/TaskFormModal.tsx`.
- **Example:** `useForm<TaskFormValues>({ resolver: zodResolver(taskFormSchema) })`.
- **Prevents:** Passing unknown form strings into mutation payloads and accepting blank task titles.
- **Alternative:** Controlled React state can work for a small form; schema-backed form handling centralizes validation and field errors.

## TanStack Query and query-key typing

- **What:** Query keys identify cached server responses; query and mutation types are inferred from typed API functions.
- **Why:** Search/filter/page arguments produce distinct cached lists. Mutations need to refresh affected cached lists and dashboard totals.
- **Where:** `src/hooks/queries/task.keys.ts`, query hooks, and `src/hooks/mutations`.
- **Example:** `taskKeys.list(filters)` keys a list; mutation success invalidates `taskKeys.lists()` and `taskKeys.dashboard()`.
- **Prevents:** Stale server data after create, update, and delete, and duplicating server tasks in Zustand.
- **Alternative:** Manual fetch/state requires implementing cache, loading, retry, and invalidation behavior by hand.

## Zustand typing and client state

- **What:** A typed Zustand store groups shared UI state with actions.
- **Why:** Navigation, filters, and modal selection are shared UI concerns; database tasks remain in the TanStack Query cache.
- **Where:** [`src/store/ui.store.ts`](../src/store/ui.store.ts).
- **Example:** `create<UiStore>((set) => ({ ... }))`.
- **Prevents:** Mixing server data and transient interface preferences into one store.
- **Alternative:** Local component state is appropriate for isolated controls; Zustand is used only for cross-page UI state.

## Strict TypeScript configuration

- **What:** Strict compiler options require explicit handling of possibly missing or incompatible values.
- **Why:** Both browser and backend boundaries need compile-time checks.
- **Where:** `tsconfig.app.json` and `tsconfig.server.json`; `npm run build` checks both before bundling.
- **Example:** Frontend `strict: true`; server uses `strict: true`, NodeNext module resolution, and a separate output directory.
- **Prevents:** Many nullability, module, and API contract errors from reaching runtime.
- **Alternative:** Vite can transpile without type-checking; the build explicitly runs TypeScript checks for each project.
