import { create } from "zustand";

const INITIAL_INTERVIEW_DATA = {
  date: undefined,
  startTime: "",
  endTime: "",
  interviewType: "online",
  meetingLink: "",
  room: "",
  instructions: "",
};

const INITIAL_BULK_INTERVIEW_DATA = {
  date: undefined,
  startTime: "",
  endTime: "",
  interviewType: "online",
  meetingLink: "",
  room: "",
};

export const useInductionStore = create((set) => ({
  // Filter & pagination
  searchTerm: "",
  statusFilter: "all",
  teamFilter: "all",
  exportFilter: "all",
  page: 0,
  responseToView: null,
  responseToDelete: null,

  setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  setTeamFilter: (teamFilter) => set({ teamFilter, page: 0 }),
  setExportFilter: (exportFilter) => set({ exportFilter }),
  setPage: (page) => set({ page }),
  setResponseToView: (responseToView) => set({ responseToView }),
  setResponseToDelete: (responseToDelete) => set({ responseToDelete }),

  // Single Interview Dialog
  isInterviewDialogOpen: false,
  interviewCandidate: null,
  interviewData: INITIAL_INTERVIEW_DATA,
  startHour: "",
  startMinute: "",
  startPeriod: "AM",
  endHour: "",
  endMinute: "",
  endPeriod: "AM",

  setIsInterviewDialogOpen: (isInterviewDialogOpen) => set({ isInterviewDialogOpen }),
  setInterviewCandidate: (interviewCandidate) => set({ interviewCandidate }),
  setInterviewData: (interviewData) => set({ interviewData }),
  setInterviewField: (field, value) =>
    set((state) => ({
      interviewData: { ...state.interviewData, [field]: value },
    })),
  setSingleTimeField: (field, value) => set({ [field]: value }),

  // Bulk Interview Dialog
  isBulkInterviewDialogOpen: false,
  bulkInterviewData: INITIAL_BULK_INTERVIEW_DATA,
  bulkStartHour: "",
  bulkStartMinute: "",
  bulkStartPeriod: "AM",
  bulkEndHour: "",
  bulkEndMinute: "",
  bulkEndPeriod: "AM",
  bulkProgress: { current: 0, total: 0 },
  bulkResults: { success: [], failed: [] },
  bulkTarget: "waiting",
  bulkTargetCount: 0,
  isBulkProgressDialogOpen: false,
  bulkActionTitle: "",

  setIsBulkInterviewDialogOpen: (isBulkInterviewDialogOpen) => set({ isBulkInterviewDialogOpen }),
  setBulkInterviewData: (bulkInterviewData) => set({ bulkInterviewData }),
  setBulkInterviewField: (field, value) =>
    set((state) => ({
      bulkInterviewData: { ...state.bulkInterviewData, [field]: value },
    })),
  setBulkTimeField: (field, value) => set({ [field]: value }),
  setBulkProgress: (bulkProgress) => set({ bulkProgress }),
  setBulkResults: (bulkResults) => set({ bulkResults }),
  setBulkTarget: (bulkTarget) => set({ bulkTarget }),
  setBulkTargetCount: (bulkTargetCount) => set({ bulkTargetCount }),
  setIsBulkProgressDialogOpen: (isBulkProgressDialogOpen) => set({ isBulkProgressDialogOpen }),
  setBulkActionTitle: (bulkActionTitle) => set({ bulkActionTitle }),

  // Announcements
  isAnnouncementDialogOpen: false,
  announcementData: { title: "", message: "" },
  singleAnnouncementRecipient: null,

  setIsAnnouncementDialogOpen: (isAnnouncementDialogOpen) => set({ isAnnouncementDialogOpen }),
  setAnnouncementData: (announcementData) => set({ announcementData }),
  setSingleAnnouncementRecipient: (singleAnnouncementRecipient) =>
    set({ singleAnnouncementRecipient }),
}));

