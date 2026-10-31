export type TaskStatus = "todo" | "in-progress" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  readonly id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  readonly createdAt: string;
  updatedAt: string;
}

export type CreateTaskInput = Omit<Task, "id" | "createdAt" | "updatedAt">;

export type EditableTask = Pick<
  Task,
  "title" | "description" | "status" | "priority" | "dueDate"
>;

export type UpdateTaskInput = Partial<
  Omit<EditableTask, "dueDate" | "description"> & {
    dueDate: string | null;
    description: string | null;
  }
>;

export type TaskPage = "overview" | "tasks";

export type TaskSort = "createdAt" | "dueDate";
export type TaskSortOrder = "asc" | "desc";

export type TaskFilters = {
  search: string;
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  overdueOnly: boolean;
  sortBy: TaskSort;
  sortOrder: TaskSortOrder;
  page: number;
  pageSize: number;
};

export interface TaskPageData {
  data: Task[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  highPriority: number;
  completionPercent: number;
  byStatus: Record<TaskStatus, number>;
}
