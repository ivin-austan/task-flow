import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, UpdateTaskInput } from "../../types/task.types";
import { updateTask } from "../../services/task.api";
import { taskKeys } from "../queries/task.keys";

type UpdateTaskVariables = Pick<Task, "id"> & {
  changes: UpdateTaskInput;
};

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, changes }: UpdateTaskVariables) => updateTask(id, changes),
    onSuccess: async (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: taskKeys.dashboard() }),
      ]);
    },
  });
}
