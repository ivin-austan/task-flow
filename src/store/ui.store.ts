import { create } from "zustand";
import type { TaskFilters, TaskPage } from "../types/task.types";

type ActiveModal =
  | { type: "create" }
  | { type: "edit" | "details"; taskId: string }
  | null;

interface UiStore {
  activePage: TaskPage;
  filters: TaskFilters;
  activeModal: ActiveModal;
  setActivePage: (page: TaskPage) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  openCreateModal: () => void;
  openEditModal: (taskId: string) => void;
  openDetailsModal: (taskId: string) => void;
  closeModal: () => void;
}

const defaultFilters: TaskFilters = {
  search: "",
  status: "all",
  priority: "all",
  overdueOnly: false,
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  pageSize: 10,
};

export const useUiStore = create<UiStore>((set) => ({
  activePage: "overview",
  filters: defaultFilters,
  activeModal: null,
  setActivePage: (activePage) => set({ activePage }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: defaultFilters }),
  openCreateModal: () => set({ activeModal: { type: "create" } }),
  openEditModal: (taskId) => set({ activeModal: { type: "edit", taskId } }),
  openDetailsModal: (taskId) => set({ activeModal: { type: "details", taskId } }),
  closeModal: () => set({ activeModal: null }),
}));
