import { create } from "zustand";

const INITIAL_MEMBER_FORM = {
  name: "",
  roll_no: "",
  nu_email: "",
  whatsapp_no: "",
  designation: "",
  linkedin: "",
  avatar: "",
};

export const useLeadStore = create((set) => ({
  // Leads Category List State (Leads.jsx)
  listPage: 0,
  listSearch: "",
  selectedLead: null,
  editLeadTitle: "",
  leadCategoryToDelete: null,
  newLeadCategoryTitle: "",
  isCreatingNewLead: false,

  setListPage: (listPage) => set({ listPage }),
  setListSearch: (listSearch) => set({ listSearch, listPage: 0 }),
  setSelectedLead: (selectedLead) =>
    set({
      selectedLead,
      editLeadTitle: selectedLead?.title || "",
    }),
  setEditLeadTitle: (editLeadTitle) => set({ editLeadTitle }),
  setLeadCategoryToDelete: (leadCategoryToDelete) => set({ leadCategoryToDelete }),
  setNewLeadCategoryTitle: (newLeadCategoryTitle) => set({ newLeadCategoryTitle }),
  setIsCreatingNewLead: (isCreatingNewLead) => set({ isCreatingNewLead }),
  resetLeadCategoryForm: () =>
    set({
      selectedLead: null,
      editLeadTitle: "",
      leadCategoryToDelete: null,
      newLeadCategoryTitle: "",
      isCreatingNewLead: false,
    }),

  // Lead Details State (LeadDetails.jsx)
  searchTerm: "",
  page: 0,
  exportFilter: "all",
  leadToDelete: null,
  isCreatingNewMember: false,
  isUpdating: false,
  idToUpdate: null,
  memberForm: INITIAL_MEMBER_FORM,

  setSearchTerm: (searchTerm) => set({ searchTerm, page: 0 }),
  setPage: (page) => set({ page }),
  setExportFilter: (exportFilter) => set({ exportFilter }),
  setLeadToDelete: (leadToDelete) => set({ leadToDelete }),
  setIsCreatingNewMember: (isCreatingNewMember) => set({ isCreatingNewMember }),
  setIsUpdating: (isUpdating) => set({ isUpdating }),
  setIdToUpdate: (idToUpdate) =>
    set({
      idToUpdate,
      memberForm: idToUpdate
        ? {
            name: idToUpdate.name || "",
            roll_no: idToUpdate.roll_no || "",
            nu_email: idToUpdate.nu_email || "",
            whatsapp_no: idToUpdate.whatsapp_no || "",
            designation: idToUpdate.designation || "",
            linkedin: idToUpdate.linkedin || "",
            avatar: idToUpdate.avatar || "",
          }
        : INITIAL_MEMBER_FORM,
    }),
  setMemberFormField: (field, value) =>
    set((state) => ({
      memberForm: { ...state.memberForm, [field]: value },
    })),
  resetMemberForm: () =>
    set({
      memberForm: INITIAL_MEMBER_FORM,
      idToUpdate: null,
      isUpdating: false,
      isCreatingNewMember: false,
    }),
}));
