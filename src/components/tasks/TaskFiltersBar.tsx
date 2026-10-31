import { ListFilter, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type {
  TaskFilters,
  TaskPriority,
  TaskStatus,
} from "../../types/task.types";

interface TaskFiltersBarProps {
  filters: TaskFilters;
  resultCount: number;
  onChange: (filters: Partial<TaskFilters>) => void;
  onClear: () => void;
}

const statuses: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const priorities: { value: TaskPriority | "all"; label: string }[] = [
  { value: "all", label: "All priorities" },
  { value: "high", label: "High priority" },
  { value: "medium", label: "Medium priority" },
  { value: "low", label: "Low priority" },
];

const selectClass =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";

export function TaskFiltersBar({
  filters,
  resultCount,
  onChange,
  onClear,
}: TaskFiltersBarProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.025)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Find your tasks</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {resultCount} {resultCount === 1 ? "task" : "tasks"} match your filters
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap">
          <label className="relative sm:col-span-2 xl:w-56">
            <span className="sr-only">Search tasks by title</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Search tasks..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select
              className={selectClass}
              value={filters.status}
              onChange={(event) => {
                const status = statuses.find((item) => item.value === event.target.value);
                if (status) onChange({ status: status.value });
              }}
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by priority</span>
            <select
              className={selectClass}
              value={filters.priority}
              onChange={(event) => {
                const priority = priorities.find(
                  (item) => item.value === event.target.value,
                );
                if (priority) onChange({ priority: priority.value });
              }}
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort tasks</span>
            <select
              className={selectClass}
              value={filters.sortBy}
              onChange={(event) => {
                if (event.target.value === "createdAt") {
                  onChange({ sortBy: "createdAt", sortOrder: "desc" });
                } else if (event.target.value === "dueDate") {
                  onChange({ sortBy: "dueDate", sortOrder: "asc" });
                }
              }}
            >
              <option value="createdAt">Newest first</option>
              <option value="dueDate">Due date</option>
            </select>
          </label>
          <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={filters.overdueOnly}
              onChange={(event) => onChange({ overdueOnly: event.target.checked })}
              className="size-4 accent-indigo-600"
            />
            Overdue
          </label>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <RotateCcw size={14} />
            Clear
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
        <ListFilter size={14} />
        Filters apply together
      </div>
    </section>
  );
}
