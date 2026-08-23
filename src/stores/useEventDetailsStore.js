import { create } from "zustand";

export const useEventDetailsStore = create((set) => ({
  page: 0,
  searchTerm: "",
  statusFilter: "all",
  attendanceFilter: "all",
  responseToDelete: null,
  isWinnerDialogOpen: false,
  selectedWinner: null,
  winnerPosition: null,
  winnerImageUrl: "",
  processingEmailId: null,
  currentCertificate: null,

  setPage: (page) => set({ page }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  setAttendanceFilter: (attendanceFilter) => set({ attendanceFilter, page: 0 }),
  setResponseToDelete: (responseToDelete) => set({ responseToDelete }),
  setIsWinnerDialogOpen: (isWinnerDialogOpen) => set({ isWinnerDialogOpen }),
  setSelectedWinner: (selectedWinner) => set({ selectedWinner }),
  setWinnerPosition: (winnerPosition) => set({ winnerPosition }),
  setWinnerImageUrl: (winnerImageUrl) => set({ winnerImageUrl }),
  setProcessingEmailId: (processingEmailId) => set({ processingEmailId }),
  setCurrentCertificate: (currentCertificate) => set({ currentCertificate }),
  resetWinnerDialog: () =>
    set({
      isWinnerDialogOpen: false,
      selectedWinner: null,
      winnerPosition: null,
      winnerImageUrl: "",
    }),
}));

