import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../../services/task.api";
import { taskKeys } from "./task.keys";

export function useDashboard() {
  return useQuery({
    queryKey: taskKeys.dashboard(),
    queryFn: fetchDashboard,
  });
}
