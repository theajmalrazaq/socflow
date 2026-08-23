import { create } from "zustand";
import { DEFAULT_PERMISSIONS } from "@/lib/permissions";

const INITIAL_NEW_USER = {
  name: "",
  email: "",
  password: "",
  role: "Member",
};

export const useUserStore = create((set) => ({
  search: "",
  roleFilter: "all",
  isCreateOpen: false,
  createStep: 1,
  newUser: INITIAL_NEW_USER,
  permissionMatrix: DEFAULT_PERMISSIONS,
  editingUser: null,
  editPermissions: DEFAULT_PERMISSIONS,
  deletingUser: null,

  setSearch: (search) => set({ search }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setIsCreateOpen: (isCreateOpen) => set({ isCreateOpen }),
  setCreateStep: (createStep) => set({ createStep }),
  setNewUser: (newUser) => set({ newUser }),
  setNewUserField: (field, value) =>
    set((state) => ({
      newUser: { ...state.newUser, [field]: value },
    })),
  setPermissionMatrix: (permissionMatrixOrFn) =>
    set((state) => ({
      permissionMatrix:
        typeof permissionMatrixOrFn === "function"
          ? permissionMatrixOrFn(state.permissionMatrix)
          : permissionMatrixOrFn,
    })),
  setEditingUser: (editingUser) => set({ editingUser }),
  setEditingUserField: (field, value) =>
    set((state) => ({
      editingUser: state.editingUser ? { ...state.editingUser, [field]: value } : null,
    })),
  setEditPermissions: (editPermissionsOrFn) =>
    set((state) => ({
      editPermissions:
        typeof editPermissionsOrFn === "function"
          ? editPermissionsOrFn(state.editPermissions)
          : editPermissionsOrFn,
    })),
  setDeletingUser: (deletingUser) => set({ deletingUser }),
  resetCreateModal: () =>
    set({
      isCreateOpen: false,
      createStep: 1,
      newUser: INITIAL_NEW_USER,
      permissionMatrix: DEFAULT_PERMISSIONS,
    }),
}));
