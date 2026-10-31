import {
  Prisma,
  TaskPriority,
  TaskStatus,
  type Task,
} from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";
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

export class TaskNotFoundError extends Error {
  constructor() {
    super("Task not found.");
    this.name = "TaskNotFoundError";
  }
}

type ApiTaskStatus = "todo" | "in-progress" | "completed";
type ApiTaskPriority = "low" | "medium" | "high";

function toPrismaStatus(status: ApiTaskStatus): TaskStatus {
  const statuses: Record<"todo" | "in-progress" | "completed", TaskStatus> = {
    todo: TaskStatus.TODO,
    "in-progress": TaskStatus.IN_PROGRESS,
    completed: TaskStatus.COMPLETED,
  };
  return statuses[status];
}

function toPrismaPriority(priority: ApiTaskPriority): TaskPriority {
  const priorities: Record<ApiTaskPriority, TaskPriority> = {
    low: TaskPriority.LOW,
    medium: TaskPriority.MEDIUM,
    high: TaskPriority.HIGH,
  };
  return priorities[priority];
}

export function toTaskDto(task: Task): TaskDto {
  const statuses: Record<TaskStatus, TaskDto["status"]> = {
    [TaskStatus.TODO]: "todo",
    [TaskStatus.IN_PROGRESS]: "in-progress",
    [TaskStatus.COMPLETED]: "completed",
  };
  const priorities: Record<TaskPriority, TaskDto["priority"]> = {
    [TaskPriority.LOW]: "low",
    [TaskPriority.MEDIUM]: "medium",
    [TaskPriority.HIGH]: "high",
  };

  return {
    id: task.id,
    title: task.title,
    ...(task.description === null ? {} : { description: task.description }),
    status: statuses[task.status],
    priority: priorities[task.priority],
    ...(task.dueDate === null
      ? {}
      : { dueDate: task.dueDate.toISOString().slice(0, 10) }),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

function toWhere(filters: TaskListFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {};

  if (filters.search) {
    where.title = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (filters.overdueOnly) {
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    where.dueDate = { lt: todayUtc };
    where.status = filters.status
      ? { equals: filters.status, not: TaskStatus.COMPLETED }
      : { not: TaskStatus.COMPLETED };
  }

  return where;
}

export async function listTasks(query: TaskListQuery) {
  const filters: TaskListFilters = {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    ...(query.status ? { status: toPrismaStatus(query.status) } : {}),
    ...(query.priority ? { priority: toPrismaPriority(query.priority) } : {}),
    overdueOnly: query.overdueOnly,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };
  const where = toWhere(filters);
  const orderBy: Prisma.TaskOrderByWithRelationInput =
    filters.sortBy === "dueDate"
      ? { dueDate: { sort: filters.sortOrder, nulls: "last" } }
      : { createdAt: filters.sortOrder };
  const skip = (filters.page - 1) * filters.pageSize;

  const [records, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      orderBy: [orderBy, { id: "asc" }],
      skip,
      take: filters.pageSize,
    }),
    prisma.task.count({ where }),
  ]);

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
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    throw new TaskNotFoundError();
  }
  return toTaskDto(task);
}

function toDueDate(value: string | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === "") return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export async function createTask(input: CreateTaskBody): Promise<TaskDto> {
  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description || null,
      status: toPrismaStatus(input.status),
      priority: toPrismaPriority(input.priority),
      dueDate: toDueDate(input.dueDate),
    },
  });
  return toTaskDto(task);
}

export async function updateTask(
  id: string,
  input: UpdateTaskBody,
): Promise<TaskDto> {
  const data: Prisma.TaskUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) {
    data.description = input.description || null;
  }
  if (input.status !== undefined) data.status = toPrismaStatus(input.status);
  if (input.priority !== undefined) data.priority = toPrismaPriority(input.priority);
  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate === null ? null : toDueDate(input.dueDate);
  }

  try {
    return toTaskDto(await prisma.task.update({ where: { id }, data }));
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new TaskNotFoundError();
    }
    throw error;
  }
}

export async function removeTask(id: string): Promise<void> {
  try {
    await prisma.task.delete({ where: { id } });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new TaskNotFoundError();
    }
    throw error;
  }
}

export async function getDashboardStatistics(): Promise<DashboardStatistics> {
  const [groups, total, highPriority] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.task.count(),
    prisma.task.count({ where: { priority: TaskPriority.HIGH } }),
  ]);

  const byStatus: DashboardStatistics["byStatus"] = {
    todo: 0,
    "in-progress": 0,
    completed: 0,
  };
  for (const group of groups) {
    if (group.status === TaskStatus.TODO) byStatus.todo = group._count._all;
    if (group.status === TaskStatus.IN_PROGRESS) {
      byStatus["in-progress"] = group._count._all;
    }
    if (group.status === TaskStatus.COMPLETED) {
      byStatus.completed = group._count._all;
    }
  }

  return {
    total,
    completed: byStatus.completed,
    pending: byStatus.todo,
    inProgress: byStatus["in-progress"],
    highPriority,
    completionPercent:
      total === 0 ? 0 : Math.round((byStatus.completed / total) * 100),
    byStatus,
  };
}
