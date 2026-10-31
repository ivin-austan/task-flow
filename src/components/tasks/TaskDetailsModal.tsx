import { CalendarDays, Clock3, History, Pencil, X } from "lucide-react";
import type { Task, TaskPriority, TaskStatus } from "../../types/task.types";
import { formatDate } from "../../utils/task.utils";

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  completed: "Completed",
};

const priorityClasses: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-rose-50 text-rose-700",
};

export function TaskDetailsModal({
  task,
  onClose,
  onEdit,
}: TaskDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-title"
        className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Task details
            </p>
            <h2 id="task-details-title" className="mt-2 break-words text-xl font-semibold text-slate-950">
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close task details"
            className="ml-3 grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            {statusLabels[task.status]}
          </span>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${priorityClasses[task.priority]}`}
          >
            {task.priority} priority
          </span>
        </div>
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Description
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {task.description || "No description has been added."}
          </p>
        </div>
        <div className="mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <CalendarDays size={16} className="mt-0.5 text-indigo-500" />
            <div>
              <p className="text-xs text-slate-400">Due date</p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {formatDate(task.dueDate)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock3 size={16} className="mt-0.5 text-indigo-500" />
            <div>
              <p className="text-xs text-slate-400">Created</p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {new Date(task.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <History size={16} className="mt-0.5 text-indigo-500" />
            <div>
              <p className="text-xs text-slate-400">Last updated</p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {new Date(task.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Pencil size={15} />
            Edit task
          </button>
        </div>
      </section>
    </div>
  );
}
