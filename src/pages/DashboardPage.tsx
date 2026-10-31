import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { StatsGrid } from "../components/dashboard/StatsGrid";
import { TaskDetailsModal } from "../components/tasks/TaskDetailsModal";
import { TaskFiltersBar } from "../components/tasks/TaskFiltersBar";
import { TaskFormModal } from "../components/tasks/TaskFormModal";
import { TaskList } from "../components/tasks/TaskList";
import { useCreateTask } from "../hooks/mutations/useCreateTask";
import { useDeleteTask } from "../hooks/mutations/useDeleteTask";
import { useUpdateTask } from "../hooks/mutations/useUpdateTask";
import { useDashboard } from "../hooks/queries/useDashboard";
import { useTask } from "../hooks/queries/useTask";
import { useTasks } from "../hooks/queries/useTasks";
import { useUiStore } from "../store/ui.store";
import type {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "../types/task.types";

interface DashboardPageProps {
  userEmail: string;
  onSignOut: () => void;
}

export function DashboardPage({ userEmail, onSignOut }: DashboardPageProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activePage = useUiStore((state) => state.activePage);
  const filters = useUiStore((state) => state.filters);
  const activeModal = useUiStore((state) => state.activeModal);
  const setActivePage = useUiStore((state) => state.setActivePage);
  const setFilters = useUiStore((state) => state.setFilters);
  const clearFilters = useUiStore((state) => state.clearFilters);
  const openCreateModal = useUiStore((state) => state.openCreateModal);
  const openEditModal = useUiStore((state) => state.openEditModal);
  const openDetailsModal = useUiStore((state) => state.openDetailsModal);
  const closeModal = useUiStore((state) => state.closeModal);

  const tasksQuery = useTasks(filters);
  const dashboardQuery = useDashboard();
  const selectedTaskId =
    activeModal && activeModal.type !== "create" ? activeModal.taskId : null;
  const selectedTaskQuery = useTask(selectedTaskId);
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const tasks = tasksQuery.data?.data ?? [];
  const stats = dashboardQuery.data;
  const mutationError =
    createMutation.error ?? updateMutation.error ?? deleteMutation.error;
  const pageTitle = activePage === "overview" ? "Your workspace" : "My tasks";
  const pageDescription =
    activePage === "overview"
      ? "A clear view of what needs your attention."
      : "Organize your work and keep every next step in view.";
  const formattedToday = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  async function handleSave(input: CreateTaskInput): Promise<void> {
    if (activeModal?.type === "edit") {
      const changes: UpdateTaskInput = {
        ...input,
        description: input.description ?? null,
        dueDate: input.dueDate ?? null,
      };
      await updateMutation.mutateAsync({ id: activeModal.taskId, changes });
      setSuccessMessage("Task updated.");
      closeModal();
      return;
    }

    await createMutation.mutateAsync(input);
    setSuccessMessage("Task created.");
    closeModal();
  }

  function handleDelete(task: Task): void {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(task.id, {
      onSuccess: () => setSuccessMessage("Task deleted."),
    });
  }

  function handleStatusChange(id: Task["id"], status: TaskStatus): void {
    updateMutation.mutate(
      { id, changes: { status } },
      { onSuccess: () => setSuccessMessage("Task status updated.") },
    );
  }

  function handleEditFromDetails(task: Task): void {
    openEditModal(task.id);
  }

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const currentPage = tasksQuery.data?.meta.page ?? filters.page;
  const totalPages = tasksQuery.data?.meta.totalPages ?? 0;
  const totalTasks = tasksQuery.data?.meta.total ?? 0;

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
      userEmail={userEmail}
      onSignOut={onSignOut}
    >
      <div className="space-y-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-600">{formattedToday}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-[34px]">
              {pageTitle}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{pageDescription}</p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
          >
            <Plus size={17} />
            New task
          </button>
        </div>

        {mutationError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <p>{mutationError.message}</p>
            <button
              type="button"
              onClick={() => {
                createMutation.reset();
                updateMutation.reset();
                deleteMutation.reset();
              }}
              aria-label="Dismiss error"
              className="shrink-0 rounded p-0.5 text-rose-700 hover:bg-rose-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <p>{successMessage}</p>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss notification"
              className="rounded p-0.5 text-emerald-700 hover:bg-emerald-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {activePage === "overview" && (
          <>
            {dashboardQuery.isPending && (
              <p role="status" className="rounded-xl bg-white p-5 text-sm text-slate-500">
                Loading dashboard statistics...
              </p>
            )}
            {dashboardQuery.isError && (
              <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
                Dashboard statistics could not be loaded: {dashboardQuery.error.message}
                <button
                  type="button"
                  onClick={() => void dashboardQuery.refetch()}
                  className="ml-3 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}
            {stats && (
              <>
                <StatsGrid stats={stats} />
                <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-sm sm:flex sm:items-center sm:justify-between sm:px-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-100">
                      Progress snapshot
                    </p>
                    <h2 className="mt-2 text-lg font-semibold">
                      {stats.completionPercent === 100 && stats.total > 0
                        ? "Everything is complete. Great work!"
                        : `${stats.pending} tasks are ready for your attention`}
                    </h2>
                    <p className="mt-1 text-sm text-indigo-100">
                      {stats.completed} of {stats.total} tasks completed
                    </p>
                  </div>
                  <div className="mt-5 min-w-40 sm:mt-0">
                    <div className="mb-2 flex justify-between text-xs text-indigo-100">
                      <span>Completion</span>
                      <span>{stats.completionPercent}%</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-white/25"
                      role="progressbar"
                      aria-label="Task completion"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={stats.completionPercent}
                    >
                      <div
                        className="h-full rounded-full bg-white transition-all"
                        style={{ width: `${stats.completionPercent}%` }}
                      />
                    </div>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {activePage === "overview" ? "Recent tasks" : "All tasks"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update progress or open a task to see its details.
            </p>
          </div>
          <TaskFiltersBar
            filters={filters}
            resultCount={totalTasks}
            onChange={(changes) => setFilters({ ...changes, page: 1 })}
            onClear={clearFilters}
          />

          {tasksQuery.isPending && (
            <p role="status" className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">
              Loading tasks...
            </p>
          )}
          {tasksQuery.isError && (
            <div role="alert" className="rounded-xl bg-rose-50 p-5 text-sm text-rose-800">
              Tasks could not be loaded: {tasksQuery.error.message}
              <button
                type="button"
                onClick={() => void tasksQuery.refetch()}
                className="ml-3 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}
          {tasksQuery.data && (
            <>
              <TaskList
                tasks={tasks}
                onStatusChange={handleStatusChange}
                onView={(task) => openDetailsModal(task.id)}
                onEdit={(task) => openEditModal(task.id)}
                onDelete={handleDelete}
              />
              <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing {totalTasks === 0 ? 0 : (currentPage - 1) * filters.pageSize + 1}
                  {"–"}
                  {Math.min(currentPage * filters.pageSize, totalTasks)} of {totalTasks} tasks
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || tasksQuery.isFetching}
                    onClick={() => setFilters({ page: currentPage - 1 })}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>
                  <span className="px-2 text-xs">
                    Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={totalPages === 0 || currentPage >= totalPages || tasksQuery.isFetching}
                    onClick={() => setFilters({ page: currentPage + 1 })}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {activeModal?.type === "create" && (
        <TaskFormModal onClose={closeModal} onSave={handleSave} />
      )}
      {activeModal?.type === "edit" && (
        <>
          {selectedTaskQuery.isPending && (
            <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4">
              <p role="status" className="rounded-xl bg-white px-6 py-4 text-sm text-slate-600">
                Loading task...
              </p>
            </div>
          )}
          {selectedTaskQuery.isError && (
            <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4">
              <div role="alert" className="rounded-xl bg-white p-6 text-sm text-rose-700">
                Task could not be loaded: {selectedTaskQuery.error.message}
                <button type="button" onClick={closeModal} className="ml-3 font-semibold underline">
                  Close
                </button>
              </div>
            </div>
          )}
          {selectedTaskQuery.data && (
            <TaskFormModal
              task={selectedTaskQuery.data}
              onClose={closeModal}
              onSave={handleSave}
            />
          )}
        </>
      )}
      {activeModal?.type === "details" && (
        <>
          {selectedTaskQuery.isPending && (
            <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4">
              <p role="status" className="rounded-xl bg-white px-6 py-4 text-sm text-slate-600">
                Loading task details...
              </p>
            </div>
          )}
          {selectedTaskQuery.isError && (
            <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4">
              <div role="alert" className="rounded-xl bg-white p-6 text-sm text-rose-700">
                Task details could not be loaded: {selectedTaskQuery.error.message}
                <button type="button" onClick={closeModal} className="ml-3 font-semibold underline">
                  Close
                </button>
              </div>
            </div>
          )}
          {selectedTaskQuery.data && (
            <TaskDetailsModal
              task={selectedTaskQuery.data}
              onClose={closeModal}
              onEdit={handleEditFromDetails}
            />
          )}
        </>
      )}
      {isMutating && (
        <span className="sr-only" role="status">
          Saving task changes...
        </span>
      )}
    </AppShell>
  );
}
