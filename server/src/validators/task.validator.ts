import { z } from "zod";

const taskStatusSchema = z.enum(["todo", "in-progress", "completed"]);
const taskPrioritySchema = z.enum(["low", "medium", "high"]);

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must use YYYY-MM-DD format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Due date must be a valid calendar date.");

const taskFieldsSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: dueDateSchema.optional(),
});

export const createTaskSchema = taskFieldsSchema.extend({
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
});

export const updateTaskSchema = taskFieldsSchema
  .extend({
    description: z.string().trim().max(1000).nullable().optional(),
    dueDate: dueDateSchema.nullable().optional(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable field is required.",
  });

export const taskIdParamsSchema = z.object({
  id: z.uuid(),
});

export const updateTaskRequestSchema = z.object({
  params: taskIdParamsSchema,
  body: updateTaskSchema,
});

export const taskListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).default(""),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  overdueOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  sortBy: z.enum(["createdAt", "dueDate"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
export type TaskIdParams = z.infer<typeof taskIdParamsSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
