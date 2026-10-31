import { useQuery } from "@tanstack/react-query";
import type { TaskFilters } from "../../types/task.types";
import { fetchTasks } from "../../services/task.api";
import { taskKeys } from "./task.keys";

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => fetchTasks(filters),
  });
}
