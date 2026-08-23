import { create } from "zustand";
import { getEmailConfig } from "@/lib/emailConfig";

const INITIAL_SOCIETY_DATA = {
  id: null,
  name: "",
  username: "",
  email: "",
  adminName: "",
  logoUrl: "",
  coverUrl: "",
  brandingColor: "#2A43F8",
  instagramUrl: "",
  linkedinUrl: "",
};

const INITIAL_SMTP_DATA = {
  user: "",
  pass: "",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  fromName: "",
};

export const useEmailSettingsStore = create((set) => ({
  activeSection: "society_profile",
  formData: getEmailConfig(),
  selectedTemplate: "announcement",
  viewMode: "desktop",
  previewHtml: "",
  previewLoading: false,
  isSaving: false,
  isSavingSociety: false,
  resetDialogOpen: false,
  testDialogOpen: false,
  testEmailAddress: "",
  sendingTest: false,
  societyData: INITIAL_SOCIETY_DATA,
  smtpData: INITIAL_SMTP_DATA,
  showSmtpPassword: false,
  testingSmtp: false,

  setActiveSection: (activeSection) => set({ activeSection }),
  setFormData: (formDataOrFn) =>
    set((state) => ({
      formData: typeof formDataOrFn === "function" ? formDataOrFn(state.formData) : formDataOrFn,
    })),
  setFormField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),
  setSelectedTemplate: (selectedTemplate) => set({ selectedTemplate }),
  setViewMode: (viewMode) => set({ viewMode }),
  setPreviewHtml: (previewHtml) => set({ previewHtml }),
  setPreviewLoading: (previewLoading) => set({ previewLoading }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsSavingSociety: (isSavingSociety) => set({ isSavingSociety }),
  setResetDialogOpen: (resetDialogOpen) => set({ resetDialogOpen }),
  setTestDialogOpen: (testDialogOpen) => set({ testDialogOpen }),
  setTestEmailAddress: (testEmailAddress) => set({ testEmailAddress }),
  setSendingTest: (sendingTest) => set({ sendingTest }),
  setSocietyData: (societyDataOrFn) =>
    set((state) => ({
      societyData:
        typeof societyDataOrFn === "function"
          ? societyDataOrFn(state.societyData)
          : societyDataOrFn,
    })),
  setSocietyField: (field, value) =>
    set((state) => ({
      societyData: { ...state.societyData, [field]: value },
    })),
  setSmtpData: (smtpDataOrFn) =>
    set((state) => ({
      smtpData: typeof smtpDataOrFn === "function" ? smtpDataOrFn(state.smtpData) : smtpDataOrFn,
    })),
  setSmtpField: (field, value) =>
    set((state) => ({
      smtpData: { ...state.smtpData, [field]: value },
    })),
  setShowSmtpPassword: (showSmtpPassword) => set({ showSmtpPassword }),
  setTestingSmtp: (testingSmtp) => set({ testingSmtp }),
}));
