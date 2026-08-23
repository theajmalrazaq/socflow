import { create } from "zustand";

const INITIAL_CREATE_FORM = {
  createTitle: "",
  createDate: undefined,
  createHour: "",
  createMinute: "",
  createPeriod: "AM",
  createSpeaker: "",
  createLinkPrimary: "",
  createLinkSecondary: "",
  createLinkOneText: "",
  createLinkTwoText: "",
  createLocation: "",
  createImgUrl: "",
  createDescription: "",
  createIsCompetition: false,
  createSendEmail: false,
  createCustomRecipients: "",
  createSendingProgress: { current: 0, total: 0 },
};

const INITIAL_EDIT_FORM = {
  title: "",
  date: undefined,
  hour: "",
  minute: "",
  period: "AM",
  speaker: "",
  linkPrimary: "",
  linkSecondary: "",
  linkOneText: "",
  linkTwoText: "",
  location: "",
  imgUrl: "",
  description: "",
  isCompetition: false,
};

export const useEventsPageStore = create((set) => ({
  page: 0,
  search: "",
  statusFilter: "all",
  eventToDelete: null,
  selectedEvent: null,
  isCreateOpen: false,
  createStep: 1,
  createLoading: false,

  setPage: (page) => set({ page }),
  setSearch: (search) => set({ search }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  setEventToDelete: (eventToDelete) => set({ eventToDelete }),
  setIsCreateOpen: (isCreateOpen) => set({ isCreateOpen }),
  setCreateStep: (createStep) => set({ createStep }),
  setCreateLoading: (createLoading) => set({ createLoading }),

  // Edit Event Form State
  editForm: INITIAL_EDIT_FORM,
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),
  setEditFormField: (field, value) =>
    set((state) => ({
      editForm: { ...state.editForm, [field]: value },
    })),
  setEditForm: (editForm) => set({ editForm }),
  resetEditForm: () => set({ selectedEvent: null, editForm: INITIAL_EDIT_FORM }),

  // Create Event Form State
  createForm: INITIAL_CREATE_FORM,
  setCreateFormField: (field, value) =>
    set((state) => ({
      createForm: { ...state.createForm, [field]: value },
    })),
  resetCreateForm: () =>
    set({
      createForm: INITIAL_CREATE_FORM,
      isCreateOpen: false,
      createStep: 1,
      createLoading: false,
    }),
}));

