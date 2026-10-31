import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarDays, X } from "lucide-react";
import { z } from "zod";
import type { CreateTaskInput, Task } from "../../types/task.types";

interface TaskFormModalProps {
  task?: Task;
  onClose: () => void;
  onSave: (input: CreateTaskInput) => Promise<void>;
}

const taskFormSchema = z.object({
  title: z.string().trim().min(1, "A task title is required.").max(120),
  description: z.string().max(1000),
  status: z.enum(["todo", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";

export function TaskFormModal({ task, onClose, onSave }: TaskFormModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      dueDate: task?.dueDate ?? "",
    },
  });

  async function submit(values: TaskFormValues): Promise<void> {
    setFormError(null);
    try {
      await onSave({
        title: values.title,
        description: values.description.trim() || undefined,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || undefined,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "The task could not be saved.";
      setFormError(message);
      setError("root.server", { type: "server", message });
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-3 grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays size={19} />
            </div>
            <h2
              id="task-form-title"
              className="text-xl font-semibold tracking-tight text-slate-950"
            >
              {task ? "Edit task" : "Create a task"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add the details now. You can update them any time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close task form"
            className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(submit)}>
          <label className="block text-sm font-medium text-slate-700">
            Title <span className="text-rose-500">*</span>
            <input
              autoFocus
              {...register("title")}
              placeholder="e.g. Prepare weekly report"
              className={fieldClass}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && (
              <span className="mt-1 block text-xs text-rose-600">
                {errors.title.message}
              </span>
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Add a few details..."
              className={`${fieldClass} resize-y`}
            />
            {errors.description && (
              <span className="mt-1 block text-xs text-rose-600">
                {errors.description.message}
              </span>
            )}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Status
              <select {...register("status")} className={fieldClass}>
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Priority
              <select {...register("priority")} className={fieldClass}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Due date
            <input type="date" {...register("dueDate")} className={fieldClass} />
          </label>
          {formError && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : task ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
