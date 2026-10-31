import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateTaskInput } from "../../types/task.types";
import { createTask } from "../../services/task.api";
import { taskKeys } from "../queries/task.keys";

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: taskKeys.dashboard() }),
      ]);
    },
  });
}
