import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task } from "../../types/task.types";
import { deleteTask } from "../../services/task.api";
import { taskKeys } from "../queries/task.keys";

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: Task["id"]) => deleteTask(id),
    onSuccess: async (_result, id) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: taskKeys.dashboard() }),
      ]);
    },
  });
}
