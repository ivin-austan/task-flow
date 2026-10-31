import { z } from "zod";
import type {
  CreateTaskInput,
  DashboardStats,
  Task,
  TaskFilters,
  TaskPageData,
  UpdateTaskInput,
} from "../types/task.types";
import {
  dashboardResponseSchema,
  taskPageResponseSchema,
  taskResponseSchema,
} from "../schemas/task.schema";
import { apiRequest } from "./api.client";

function toQueryString(filters: TaskFilters): string {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
    search: filters.search,
    overdueOnly: String(filters.overdueOnly),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.priority !== "all") params.set("priority", filters.priority);
  return params.toString();
}

export async function fetchTasks(filters: TaskFilters): Promise<TaskPageData> {
  return taskPageResponseSchema.parse(
    await apiRequest(`/tasks?${toQueryString(filters)}`),
  );
}

export async function fetchTask(id: string): Promise<Task> {
  const response = zTaskEnvelope.parse(await apiRequest(`/tasks/${id}`));
  return response.data;
}

export async function fetchDashboard(): Promise<DashboardStats> {
  const response = dashboardResponseSchema.parse(
    await apiRequest("/tasks/dashboard"),
  );
  return response.data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = zTaskEnvelope.parse(
    await apiRequest("/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
  return response.data;
}

export async function updateTask(
  id: string,
  changes: UpdateTaskInput,
): Promise<Task> {
  const response = zTaskEnvelope.parse(
    await apiRequest(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    }),
  );
  return response.data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiRequest(`/tasks/${id}`, { method: "DELETE" });
}

const zTaskEnvelope = z.object({
  data: taskResponseSchema,
});
