import type {
  TaskPriority,
  TaskStatus,
} from "../generated/prisma/client.js";

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListFilters {
  page: number;
  pageSize: number;
  search: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  overdueOnly: boolean;
  sortBy: "createdAt" | "dueDate";
  sortOrder: "asc" | "desc";
}

export interface DashboardStatistics {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  highPriority: number;
  completionPercent: number;
  byStatus: Record<"todo" | "in-progress" | "completed", number>;
}
