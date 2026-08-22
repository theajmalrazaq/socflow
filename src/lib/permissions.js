/**
 * Default permission matrix template with nested page list & sub-permission toggles.
 */
export const DEFAULT_PERMISSIONS = {
  dashboard: {
    enabled: true,
    sub: {
      viewStats: true,
      quickSettings: true,
    },
  },
  events: {
    enabled: true,
    sub: {
      viewRegistrations: true,
      createEvent: true,
      editEvent: true,
      deleteEvent: true,
      selectWinners: true,
      generateCertificates: true,
    },
  },
  leads: {
    enabled: true,
    sub: {
      readOnly: true,
      changeStatus: true,
      addMember: true,
      deleteLead: true,
      exportData: true,
    },
  },
  inductions: {
    enabled: true,
    sub: {
      readOnly: true,
      changeStatus: true,
      sendEmails: true,
      deleteResponse: true,
    },
  },
  members: {
    enabled: true,
    sub: {
      readOnly: true,
      changeStatus: true,
      deleteMember: true,
      exportData: true,
    },
  },
  emails: {
    enabled: true,
    sub: {
      viewResponses: true,
      changeStatus: true,
      sendEmail: true,
      deleteEmail: true,
      manageSettings: true,
    },
  },
  users: {
    enabled: true,
    sub: {
      createUser: true,
      editRole: true,
      deleteUser: true,
    },
  },
  analytics: {
    enabled: true,
    sub: {
      viewCharts: true,
      exportReports: true,
    },
  },
};

/**
 * Pre-defined Role Presets
 */
export const ROLE_PRESETS = {
  ADMIN: "admin",
  EVENT_MANAGER: "event_manager",
  READ_ONLY: "read_only",
  CUSTOM: "custom",
};

export const EVENT_MANAGER_PRESET = {
  dashboard: { enabled: true, sub: { viewStats: true, quickSettings: false } },
  events: DEFAULT_PERMISSIONS.events,
  leads: {
    enabled: false,
    sub: {
      readOnly: false,
      changeStatus: false,
      addMember: false,
      deleteLead: false,
      exportData: false,
    },
  },
  inductions: {
    enabled: false,
    sub: { readOnly: false, changeStatus: false, sendEmails: false, deleteResponse: false },
  },
  members: {
    enabled: false,
    sub: { readOnly: false, changeStatus: false, deleteMember: false, exportData: false },
  },
  emails: DEFAULT_PERMISSIONS.emails,
  users: { enabled: false, sub: { createUser: false, editRole: false, deleteUser: false } },
};

export const READ_ONLY_PRESET = {
  dashboard: { enabled: true, sub: { viewStats: true, quickSettings: false } },
  events: {
    enabled: true,
    sub: {
      viewRegistrations: true,
      createEvent: false,
      editEvent: false,
      deleteEvent: false,
      selectWinners: false,
      generateCertificates: false,
    },
  },
  leads: {
    enabled: false,
    sub: {
      readOnly: false,
      changeStatus: false,
      addMember: false,
      deleteLead: false,
      exportData: false,
    },
  },
  inductions: {
    enabled: false,
    sub: { readOnly: false, changeStatus: false, sendEmails: false, deleteResponse: false },
  },
  members: {
    enabled: false,
    sub: { readOnly: false, changeStatus: false, deleteMember: false, exportData: false },
  },
  emails: {
    enabled: false,
    sub: {
      viewResponses: false,
      changeStatus: false,
      sendEmail: false,
      deleteEmail: false,
      manageSettings: false,
    },
  },
  users: { enabled: false, sub: { createUser: false, editRole: false, deleteUser: false } },
};

/**
 * Parse permissions object or string
 */
export function parsePermissions(permInput) {
  if (!permInput) return DEFAULT_PERMISSIONS;

  let obj = null;
  if (typeof permInput === "object" && permInput !== null) {
    obj = permInput;
  } else if (typeof permInput === "string") {
    try {
      const parsed = JSON.parse(permInput);
      if (typeof parsed === "object" && parsed !== null) {
        obj = parsed;
      }
    } catch (_e) {
      // Not JSON string
    }
  }

  if (obj) {
    return {
      dashboard: {
        ...DEFAULT_PERMISSIONS.dashboard,
        ...obj.dashboard,
        sub: { ...DEFAULT_PERMISSIONS.dashboard?.sub, ...obj.dashboard?.sub },
      },
      events: {
        ...DEFAULT_PERMISSIONS.events,
        ...obj.events,
        sub: { ...DEFAULT_PERMISSIONS.events?.sub, ...obj.events?.sub },
      },
      leads: {
        ...DEFAULT_PERMISSIONS.leads,
        ...obj.leads,
        sub: { ...DEFAULT_PERMISSIONS.leads?.sub, ...obj.leads?.sub },
      },
      inductions: {
        ...DEFAULT_PERMISSIONS.inductions,
        ...obj.inductions,
        sub: { ...DEFAULT_PERMISSIONS.inductions?.sub, ...obj.inductions?.sub },
      },
      members: {
        ...DEFAULT_PERMISSIONS.members,
        ...obj.members,
        sub: { ...DEFAULT_PERMISSIONS.members?.sub, ...obj.members?.sub },
      },
      emails: {
        ...DEFAULT_PERMISSIONS.emails,
        ...obj.emails,
        sub: { ...DEFAULT_PERMISSIONS.emails?.sub, ...obj.emails?.sub },
      },
      users: {
        ...DEFAULT_PERMISSIONS.users,
        ...obj.users,
        sub: { ...DEFAULT_PERMISSIONS.users?.sub, ...obj.users?.sub },
      },
      analytics: {
        ...DEFAULT_PERMISSIONS.analytics,
        ...obj.analytics,
        sub: { ...DEFAULT_PERMISSIONS.analytics?.sub, ...obj.analytics?.sub },
      },
    };
  }

  // Legacy preset string checks
  const isFullAdmin = permInput === "admin" || permInput === "full" || permInput === "RnVsbA==";
  const isEventManager = permInput === "event_manager" || permInput === "Y29udGVudF9vbmx5";
  const isReadOnly =
    permInput === "read_only" ||
    permInput === "registrations_only" ||
    permInput === "cmVnaXN0cmF0aW9uc19vbmx5";

  if (isFullAdmin) return DEFAULT_PERMISSIONS;
  if (isEventManager) return EVENT_MANAGER_PRESET;
  if (isReadOnly) return READ_ONLY_PRESET;

  return DEFAULT_PERMISSIONS;
}

/**
 * Check if user is an Admin
 */
export function isAdmin(permInput) {
  if (!permInput) return false;
  if (permInput === "admin" || permInput === "full" || permInput === "RnVsbA==") return true;
  if (typeof permInput === "object" && permInput?.role === "admin") return true;
  return false;
}

/**
 * Check page & sub-permission access dynamically
 */
export function hasPermission(permInput, pageKey, subKey = null) {
  if (!permInput) return false;
  if (isAdmin(permInput)) return true;

  const p = parsePermissions(permInput);
  const pagePerm = p?.[pageKey];

  if (!pagePerm || pagePerm.enabled === false) return false;
  if (!subKey) return true;

  return Boolean(pagePerm.sub?.[subKey]);
}

// Backward-compatible export helper aliases
export function canManageEvents(permInput) {
  return hasPermission(permInput, "events");
}

export function canViewRegistrations(permInput) {
  return hasPermission(permInput, "events", "viewRegistrations");
}

export function canManageLeads(permInput) {
  return hasPermission(permInput, "leads");
}

export function canManageInductions(permInput) {
  return hasPermission(permInput, "inductions");
}

export function canManageMembers(permInput) {
  return hasPermission(permInput, "members");
}

export function canManageEmails(permInput) {
  return hasPermission(permInput, "emails");
}

export function canManageEmailSettings(permInput) {
  return hasPermission(permInput, "emails", "manageSettings") || canManageEmails(permInput);
}

export function canManageUsers(permInput) {
  return hasPermission(permInput, "users");
}

export function canViewAnalytics(permInput) {
  return hasPermission(permInput, "analytics");
}
