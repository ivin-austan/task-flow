import { z } from "zod";

export const taskResponseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const taskPageResponseSchema = z.object({
  data: z.array(taskResponseSchema),
  meta: z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export const dashboardResponseSchema = z.object({
  data: z.object({
    total: z.number().int(),
    completed: z.number().int(),
    pending: z.number().int(),
    inProgress: z.number().int(),
    highPriority: z.number().int(),
    completionPercent: z.number().min(0).max(100),
    byStatus: z.object({
      todo: z.number().int(),
      "in-progress": z.number().int(),
      completed: z.number().int(),
    }),
  }),
});
