import { useQuery } from "@tanstack/react-query";
import { fetchTask } from "../../services/task.api";
import { taskKeys } from "./task.keys";

export function useTask(id: string | null) {
  return useQuery({
    queryKey: taskKeys.detail(id ?? ""),
    queryFn: () => fetchTask(id ?? ""),
    enabled: id !== null,
  });
}
