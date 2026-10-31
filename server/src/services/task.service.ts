import { and } from "@prisma/orm-postgres/orm-client";
import { db } from "../prisma/db.js";
import type { Models } from "../prisma/contract.js";
import type {
  CreateTaskBody,
  TaskListQuery,
  UpdateTaskBody,
} from "../validators/task.validator.js";
import type {
  DashboardStatistics,
  TaskDto,
  TaskListFilters,
} from "../types/task.types.js";

type TaskRecord = Models.public_Task;
type TaskStatus = TaskRecord["status"];
type TaskPriority = TaskRecord["priority"];
type ApiTaskStatus = TaskDto["status"];
type ApiTaskPriority = TaskDto["priority"];

export class TaskNotFoundError extends Error {
  constructor() {
    super("Task not found.");
    this.name = "TaskNotFoundError";
  }
}

const apiToDbStatus: Record<ApiTaskStatus, TaskStatus> = {
  todo: "TODO",
  "in-progress": "IN_PROGRESS",
  completed: "COMPLETED",
};
const dbToApiStatus: Record<TaskStatus, ApiTaskStatus> = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
};
const apiToDbPriority: Record<ApiTaskPriority, TaskPriority> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};
const dbToApiPriority: Record<TaskPriority, ApiTaskPriority> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

export function toTaskDto(task: TaskRecord): TaskDto {
  return {
    id: task.id,
    title: task.title,
    ...(task.description === null ? {} : { description: task.description }),
    status: dbToApiStatus[task.status],
    priority: dbToApiPriority[task.priority],
    ...(task.dueDate === null ? {} : { dueDate: task.dueDate }),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function whereTasks(filters: TaskListFilters) {
  return db.orm.public.Task.where((task) => {
    const conditions = [task.id.isNotNull()];

    if (filters.search) {
      const search = filters.search.replace(/[\\%_]/g, "\\$&");
      conditions.push(task.title.ilike(`%${search}%`));
    }
    if (filters.status) {
      conditions.push(task.status.eq(filters.status));
    }
    if (filters.priority) {
      conditions.push(task.priority.eq(filters.priority));
    }
    if (filters.overdueOnly) {
      conditions.push(task.dueDate.lt(new Date().toISOString().slice(0, 10)));
      conditions.push(task.status.neq("COMPLETED"));
    }

    return and(...conditions);
  });
}

export async function listTasks(query: TaskListQuery) {
  const filters: TaskListFilters = {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    ...(query.status ? { status: apiToDbStatus[query.status] } : {}),
    ...(query.priority ? { priority: apiToDbPriority[query.priority] } : {}),
    overdueOnly: query.overdueOnly,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };
  const skip = (filters.page - 1) * filters.pageSize;

  const recordsQuery = whereTasks(filters)
    .orderBy([
      (task) =>
        filters.sortBy === "dueDate"
          ? task.dueDate[filters.sortOrder]({ nulls: "last" })
          : task.createdAt[filters.sortOrder](),
      (task) => task.id.asc(),
    ])
    .limit(filters.pageSize)
    .offset(skip);

  const [records, count] = await Promise.all([
    recordsQuery.all(),
    whereTasks(filters).aggregate((aggregate) => ({
      total: aggregate.count(),
    })),
  ]);
  const total = count.total;

  return {
    data: records.map(toTaskDto),
    meta: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
    },
  };
}

export async function getTask(id: string): Promise<TaskDto> {
  const task = await db.orm.public.Task.first({ id });
  if (task === null) {
    throw new TaskNotFoundError();
  }
  return toTaskDto(task);
}

function toDueDate(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value === "" ? null : value;
}

export async function createTask(input: CreateTaskBody): Promise<TaskDto> {
  const task = await db.orm.public.Task.create({
    title: input.title,
    description: input.description || null,
    status: apiToDbStatus[input.status],
    priority: apiToDbPriority[input.priority],
    dueDate: toDueDate(input.dueDate),
  });
  return toTaskDto(task);
}

export async function updateTask(
  id: string,
  input: UpdateTaskBody,
): Promise<TaskDto> {
  const data: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | null;
  } = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) {
    data.description = input.description || null;
  }
  if (input.status !== undefined) data.status = apiToDbStatus[input.status];
  if (input.priority !== undefined) {
    data.priority = apiToDbPriority[input.priority];
  }
  if (input.dueDate !== undefined) data.dueDate = toDueDate(input.dueDate);

  const task = await db.orm.public.Task
    .where((record) => record.id.eq(id))
    .update(data);
  if (task === null) {
    throw new TaskNotFoundError();
  }
  return toTaskDto(task);
}

export async function removeTask(id: string): Promise<void> {
  const task = await db.orm.public.Task
    .where((record) => record.id.eq(id))
    .delete();
  if (task === null) {
    throw new TaskNotFoundError();
  }
}

export async function getDashboardStatistics(): Promise<DashboardStatistics> {
  const [totalResult, highPriorityResult, todoResult, inProgressResult, completedResult] =
    await Promise.all([
      db.orm.public.Task.aggregate((aggregate) => ({
        count: aggregate.count(),
      })),
      db.orm.public.Task
        .where((task) => task.priority.eq("HIGH"))
        .aggregate((aggregate) => ({ count: aggregate.count() })),
      db.orm.public.Task
        .where((task) => task.status.eq("TODO"))
        .aggregate((aggregate) => ({ count: aggregate.count() })),
      db.orm.public.Task
        .where((task) => task.status.eq("IN_PROGRESS"))
        .aggregate((aggregate) => ({ count: aggregate.count() })),
      db.orm.public.Task
        .where((task) => task.status.eq("COMPLETED"))
        .aggregate((aggregate) => ({ count: aggregate.count() })),
    ]);

  const total = totalResult.count;
  const byStatus: DashboardStatistics["byStatus"] = {
    todo: todoResult.count,
    "in-progress": inProgressResult.count,
    completed: completedResult.count,
  };

  return {
    total,
    completed: byStatus.completed,
    pending: byStatus.todo,
    inProgress: byStatus["in-progress"],
    highPriority: highPriorityResult.count,
    completionPercent:
      total === 0 ? 0 : Math.round((byStatus.completed / total) * 100),
    byStatus,
  };
}
