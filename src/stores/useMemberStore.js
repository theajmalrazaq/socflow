import { create } from "zustand";

export const useMemberStore = create((set) => ({
  searchTerm: "",
  statusFilter: "all",
  teamFilter: "all",
  page: 0,
  exportFilter: "all",
  responseToView: null,
  responseToDelete: null,

  setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  setTeamFilter: (teamFilter) => set({ teamFilter, page: 0 }),
  setPage: (page) => set({ page }),
  setExportFilter: (exportFilter) => set({ exportFilter }),
  setResponseToView: (responseToView) => set({ responseToView }),
  setResponseToDelete: (responseToDelete) => set({ responseToDelete }),
}));
