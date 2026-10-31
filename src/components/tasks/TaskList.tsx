import { CalendarDays, Eye, Pencil, Trash2 } from "lucide-react";
import type { Task, TaskPriority, TaskStatus } from "../../types/task.types";
import { formatDate } from "../../utils/task.utils";

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (id: Task["id"], status: TaskStatus) => void;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  completed: "Completed",
};

const statusClasses: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-600",
  "in-progress": "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
};

const priorityClasses: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-rose-50 text-rose-700",
};

const statusOptions: TaskStatus[] = ["todo", "in-progress", "completed"];

function isOverdue(task: Task): boolean {
  return Boolean(
    task.dueDate &&
      task.status !== "completed" &&
      task.dueDate < new Date().toISOString().slice(0, 10),
  );
}

export function TaskList({
  tasks,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <CalendarDays size={21} />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-slate-900">No tasks found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your filters or create a task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)]">
      <div className="hidden grid-cols-[minmax(220px,1.8fr)_minmax(120px,0.9fr)_minmax(120px,0.8fr)_minmax(130px,0.9fr)_110px] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 md:grid">
        <span>Task</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Due date</span>
        <span className="text-right">Actions</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="grid gap-3 px-4 py-4 transition hover:bg-slate-50/70 sm:px-5 md:grid-cols-[minmax(220px,1.8fr)_minmax(120px,0.9fr)_minmax(120px,0.8fr)_minmax(130px,0.9fr)_110px] md:items-center md:gap-4"
          >
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onView(task)}
                className="max-w-full truncate text-left text-sm font-semibold text-slate-800 hover:text-indigo-700"
              >
                {task.title}
              </button>
              <p className="mt-1 truncate text-xs text-slate-400">
                {task.description || "No description"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 md:hidden">
                <label>
                  <span className="sr-only">Status for {task.title}</span>
                  <select
                    value={task.status}
                    onChange={(event) => {
                      const status = statusOptions.find(
                        (option) => option === event.target.value,
                      );
                      if (status) onStatusChange(task.id, status);
                    }}
                    className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold outline-none ${statusClasses[task.status]}`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${priorityClasses[task.priority]}`}
                >
                  {task.priority}
                </span>
                <span
                  className={`text-xs ${isOverdue(task) ? "font-semibold text-rose-600" : "text-slate-400"}`}
                >
                  {formatDate(task.dueDate)}
                </span>
              </div>
            </div>
            <label className="hidden md:block">
              <span className="sr-only">Status for {task.title}</span>
              <select
                value={task.status}
                onChange={(event) => {
                  const status = statusOptions.find(
                    (option) => option === event.target.value,
                  );
                  if (status) onStatusChange(task.id, status);
                }}
                className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ring-0 ${statusClasses[task.status]}`}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <span
              className={`hidden w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize md:inline-flex ${priorityClasses[task.priority]}`}
            >
              {task.priority}
            </span>
            <span
              className={`hidden text-xs md:inline ${isOverdue(task) ? "font-semibold text-rose-600" : "text-slate-500"}`}
            >
              {formatDate(task.dueDate)}
              {isOverdue(task) && <span className="ml-1 text-[10px]">Overdue</span>}
            </span>
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => onView(task)}
                aria-label={`View ${task.title}`}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <Eye size={16} />
              </button>
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Edit ${task.title}`}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                aria-label={`Delete ${task.title}`}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
