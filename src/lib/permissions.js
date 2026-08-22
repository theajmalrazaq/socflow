/**
 * Full permission matrix with all permissions enabled (used as template/defaults).
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
 * Empty permission matrix with all permissions disabled.
 */
export const NO_PERMISSIONS = {
  dashboard: { enabled: false, sub: { viewStats: false, quickSettings: false } },
  events: {
    enabled: false,
    sub: {
      viewRegistrations: false,
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
    sub: {
      readOnly: false,
      changeStatus: false,
      sendEmails: false,
      deleteResponse: false,
    },
  },
  members: {
    enabled: false,
    sub: {
      readOnly: false,
      changeStatus: false,
      deleteMember: false,
      exportData: false,
    },
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
  users: {
    enabled: false,
    sub: {
      createUser: false,
      editRole: false,
      deleteUser: false,
    },
  },
  analytics: {
    enabled: false,
    sub: {
      viewCharts: false,
      exportReports: false,
    },
  },
};

/**
 * Parse permissions matrix from database record (object or JSON string).
 */
export function parsePermissions(permInput) {
  if (!permInput) return NO_PERMISSIONS;

  let raw = permInput;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return NO_PERMISSIONS;
    }
  }

  if (typeof raw === "object" && raw !== null) {
    // If wrapped in a user object e.g. { permissions: { ... } }
    if (raw.permissions && typeof raw.permissions === "object") {
      raw = raw.permissions;
    }

    const mergeSection = (key) => {
      const section = raw[key] || {};
      const defaultSub = NO_PERMISSIONS[key]?.sub || {};
      const currentSub = section.sub || {};
      return {
        enabled: Boolean(section.enabled),
        sub: {
          ...defaultSub,
          ...currentSub,
        },
      };
    };

    return {
      dashboard: mergeSection("dashboard"),
      events: mergeSection("events"),
      leads: mergeSection("leads"),
      inductions: mergeSection("inductions"),
      members: mergeSection("members"),
      emails: mergeSection("emails"),
      users: mergeSection("users"),
      analytics: mergeSection("analytics"),
    };
  }

  return NO_PERMISSIONS;
}

/**
 * Check if user has admin privileges (i.e. permission to manage users).
 */
export function isAdmin(permInput) {
  return hasPermission(permInput, "users");
}

/**
 * Check dynamic page & function access from permissions matrix.
 */
export function hasPermission(permInput, pageKey, subKey = null) {
  if (!permInput) return false;

  const matrix = parsePermissions(permInput);
  const pagePerm = matrix?.[pageKey];

  if (!pagePerm || !pagePerm.enabled) return false;
  if (!subKey) return true;

  return Boolean(pagePerm.sub?.[subKey]);
}

// Helper functions for specific pages and functions
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
