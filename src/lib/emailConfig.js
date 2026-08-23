import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export const DEFAULT_EMAIL_CONFIG = {
  brandName: "",
  senderName: "",
  logoUrl: "",
  bannerUrl: "",
  supportEmail: "",
  primaryColor: "#2A43F8",
  buttonTextColor: "#FFFFFF",
  backgroundColor: "#FAFAFA",
  cardBackgroundColor: "#FFFFFF",
  textColor: "#09090B",
  mutedColor: "#71717A",
  borderColor: "#E4E4E7",
  fontSize: "base", // "sm" | "base" | "lg" | "xl"
  instagramUrl: "",
  linkedinUrl: "",
  footerCopyright: "",
  footerDisclaimer: "",
};

export const FONT_SIZE_PRESETS = [
  { id: "sm", label: "Small", basePx: "14px", description: "Compact text sizing" },
  { id: "base", label: "Default", basePx: "16px", description: "Standard balanced sizing" },
  { id: "lg", label: "Large", basePx: "18px", description: "High readability sizing" },
  { id: "xl", label: "Extra Large", basePx: "20px", description: "Spacious prominent sizing" },
];

export function getEmailFontSizes(size = "base") {
  const normalized = String(size || "base").toLowerCase();
  switch (normalized) {
    case "sm":
    case "small":
      return {
        xs: "11px",
        sm: "12px",
        base: "14px",
        lg: "16px",
        xl: "18px",
        "2xl": "21px",
        "3xl": "26px",
      };
    case "lg":
    case "large":
      return {
        xs: "13px",
        sm: "15px",
        base: "18px",
        lg: "20px",
        xl: "22px",
        "2xl": "27px",
        "3xl": "34px",
      };
    case "xl":
    case "xlarge":
    case "extra-large":
      return {
        xs: "14px",
        sm: "16px",
        base: "20px",
        lg: "22px",
        xl: "25px",
        "2xl": "30px",
        "3xl": "38px",
      };
    case "base":
    case "normal":
    case "medium":
    case "default":
    default:
      return {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "30px",
      };
  }
}

export const COLOR_PRESETS = [
  {
    name: "Socflow Blue",
    primaryColor: "#2A43F8",
    buttonTextColor: "#FFFFFF",
    backgroundColor: "#FAFAFA",
    cardBackgroundColor: "#FFFFFF",
    borderColor: "#E4E4E7",
    textColor: "#09090B",
    mutedColor: "#71717A",
  },
  {
    name: "Electric Indigo",
    primaryColor: "#4F46E5",
    buttonTextColor: "#FFFFFF",
    backgroundColor: "#F8FAFC",
    cardBackgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    textColor: "#0F172A",
    mutedColor: "#64748B",
  },
  {
    name: "Royal Violet",
    primaryColor: "#7C3AED",
    buttonTextColor: "#FFFFFF",
    backgroundColor: "#FAF5FF",
    cardBackgroundColor: "#FFFFFF",
    borderColor: "#E9D5FF",
    textColor: "#1E1B4B",
    mutedColor: "#6B7280",
  },
  {
    name: "Emerald Green",
    primaryColor: "#059669",
    buttonTextColor: "#FFFFFF",
    backgroundColor: "#F0FDF4",
    cardBackgroundColor: "#FFFFFF",
    borderColor: "#D1FAE5",
    textColor: "#064E3B",
    mutedColor: "#6B7280",
  },
  {
    name: "Sunset Crimson",
    primaryColor: "#E11D48",
    buttonTextColor: "#FFFFFF",
    backgroundColor: "#FFF1F2",
    cardBackgroundColor: "#FFFFFF",
    borderColor: "#FFE4E6",
    textColor: "#4C0519",
    mutedColor: "#71717A",
  },
  {
    name: "Amber Gold",
    primaryColor: "#D97706",
    buttonTextColor: "#FFFFFF",
    backgroundColor: "#FFFBEB",
    cardBackgroundColor: "#FFFFFF",
    borderColor: "#FEF3C7",
    textColor: "#451A03",
    mutedColor: "#78716C",
  },
  {
    name: "Cyan Sky",
    primaryColor: "#0891B2",
    buttonTextColor: "#FFFFFF",
    backgroundColor: "#ECFEFF",
    cardBackgroundColor: "#FFFFFF",
    borderColor: "#CFFAFE",
    textColor: "#164E63",
    mutedColor: "#64748B",
  },
  {
    name: "Midnight Minimal",
    primaryColor: "#18181B",
    buttonTextColor: "#FFFFFF",
    backgroundColor: "#F4F4F5",
    cardBackgroundColor: "#FFFFFF",
    borderColor: "#E4E4E7",
    textColor: "#18181B",
    mutedColor: "#71717A",
  },
];

const STORAGE_KEY = "email_template_config";
const CONFIG_EVENT = "email_config_updated";

// In-memory runtime cache populated from Supabase DB
let activeDbConfig = { ...DEFAULT_EMAIL_CONFIG };
let isInitialFetched = false;

function isLegacyString(str) {
  if (!str || typeof str !== "string") return false;
  const lower = str.toLowerCase();
  return (
    lower.includes("mlsa") ||
    lower.includes("cfd") ||
    lower.includes("nu.edu.pk") ||
    lower.includes("f230524") ||
    lower.includes("management system") ||
    lower.includes("if you find any mistake")
  );
}

function cleanCustomSettings(customSettings = {}) {
  if (!customSettings || typeof customSettings !== "object") return {};
  const cleaned = { ...customSettings };
  for (const key of Object.keys(cleaned)) {
    if (isLegacyString(cleaned[key])) {
      delete cleaned[key];
    }
  }
  return cleaned;
}

/**
 * Build config directly from society record in database
 */
export function buildSocietyEmailConfig(soc = null, customSettings = {}) {
  const name = soc?.name || "";
  const email = soc?.email || "";
  const year = new Date().getFullYear();

  const cleaned = cleanCustomSettings(customSettings);

  const defaultCopyright = name
    ? `© ${year} ${name}. All rights reserved.`
    : `© ${year} Society. All rights reserved.`;

  const defaultDisclaimer = name
    ? email
      ? `This email was sent by ${name}. For questions, contact ${email}.`
      : `This email was sent by ${name}.`
    : "";

  return {
    ...DEFAULT_EMAIL_CONFIG,
    brandName: name,
    senderName: name ? `${name} Team` : "Society Team",
    logoUrl: soc?.logo_url || "",
    bannerUrl: soc?.cover_url || "",
    primaryColor: soc?.branding_color || "#2A43F8",
    instagramUrl: soc?.instagram_url || "",
    linkedinUrl: soc?.linkedin_url || "",
    supportEmail: email,
    ...cleaned,
    footerCopyright: cleaned.footerCopyright || defaultCopyright,
    footerDisclaimer: cleaned.footerDisclaimer || defaultDisclaimer,
    // Always preserve real society core details from DB
    ...(name ? { brandName: name, senderName: `${name} Team` } : {}),
    ...(email ? { supportEmail: email } : {}),
    ...(soc?.logo_url ? { logoUrl: soc.logo_url } : {}),
    ...(soc?.cover_url ? { bannerUrl: soc.cover_url } : {}),
    ...(soc?.branding_color ? { primaryColor: soc.branding_color } : {}),
    ...(soc?.instagram_url ? { instagramUrl: soc.instagram_url } : {}),
    ...(soc?.linkedin_url ? { linkedinUrl: soc.linkedin_url } : {}),
  };
}

/**
 * Fetch latest configuration directly from Supabase Database
 */
export async function fetchEmailConfigFromDB() {
  try {
    // 1. Fetch society record for active branding & social info
    const { data: socData } = await supabase
      .from("societies")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    const soc = socData && socData.length > 0 ? socData[0] : null;

    // 2. Fetch from app_settings table
    const { data: settingsData, error: settingsError } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", STORAGE_KEY)
      .maybeSingle();

    const savedConfig = !settingsError && settingsData?.value ? settingsData.value : {};

    activeDbConfig = buildSocietyEmailConfig(soc, savedConfig);

    isInitialFetched = true;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeDbConfig));
      } catch {}
      window.dispatchEvent(new CustomEvent(CONFIG_EVENT, { detail: activeDbConfig }));
    }
  } catch (err) {
    console.warn("Could not fetch email config from Supabase DB:", err);
  }

  return activeDbConfig;
}

// Auto-trigger DB fetch in browser
if (typeof window !== "undefined") {
  fetchEmailConfigFromDB();
}

/**
 * Synchronous getter returning current DB-backed configuration
 */
export function getEmailConfig() {
  if (isInitialFetched) return activeDbConfig;

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        activeDbConfig = buildSocietyEmailConfig(null, parsed);
      }
    } catch {}
  }

  return activeDbConfig;
}

/**
 * Save updated email configuration directly to Supabase Database (app_settings)
 */
export async function saveEmailConfig(newConfig) {
  const merged = {
    ...DEFAULT_EMAIL_CONFIG,
    ...activeDbConfig,
    ...newConfig,
  };

  activeDbConfig = merged;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {}
    window.dispatchEvent(new CustomEvent(CONFIG_EVENT, { detail: merged }));
  }

  // Persist directly to Supabase DB
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: STORAGE_KEY,
      value: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    console.error("Supabase app_settings error:", error);
    throw new Error(error.message || "Failed to save settings in database");
  }

  return merged;
}

/**
 * Reset email configuration back to default in Supabase Database
 */
export async function resetEmailConfig() {
  activeDbConfig = { ...DEFAULT_EMAIL_CONFIG };

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    window.dispatchEvent(new CustomEvent(CONFIG_EVENT, { detail: activeDbConfig }));
  }

  // Delete from Supabase DB
  await supabase.from("app_settings").delete().eq("key", STORAGE_KEY);

  // Reload from society record
  return await fetchEmailConfigFromDB();
}

/**
 * React hook to observe and update email configuration with Realtime DB sync
 */
export function useEmailConfig() {
  const [config, setConfig] = useState(getEmailConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!isInitialFetched);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      const dbConfig = await fetchEmailConfigFromDB();
      if (mounted) {
        setConfig(dbConfig);
        setIsLoading(false);
      }
    }

    load();

    const handleConfigChange = (e) => {
      if (e?.detail) {
        setConfig(e.detail);
      } else {
        setConfig(getEmailConfig());
      }
    };

    window.addEventListener(CONFIG_EVENT, handleConfigChange);

    // Supabase Realtime channel to listen for remote DB updates
    const channel = supabase
      .channel("realtime-app-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, () => {
        fetchEmailConfigFromDB();
      })
      .subscribe();

    return () => {
      mounted = false;
      window.removeEventListener(CONFIG_EVENT, handleConfigChange);
      supabase.removeChannel(channel);
    };
  }, []);

  const updateConfig = useCallback(async (updates) => {
    setIsSaving(true);
    try {
      const saved = await saveEmailConfig(updates);
      setConfig(saved);
      return saved;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const resetConfig = useCallback(async () => {
    setIsSaving(true);
    try {
      const reset = await resetEmailConfig();
      setConfig(reset);
      return reset;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    config,
    updateConfig,
    resetConfig,
    isSaving,
    isLoading,
  };
}

export const DEFAULT_SMTP_CONFIG = {
  user: "",
  pass: "",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  fromName: "",
};

const SMTP_STORAGE_KEY = "smtp_delivery_config";
let activeSmtpConfig = { ...DEFAULT_SMTP_CONFIG };

export async function fetchSmtpConfigFromDB() {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SMTP_STORAGE_KEY)
      .maybeSingle();

    if (!error && data?.value) {
      activeSmtpConfig = {
        ...DEFAULT_SMTP_CONFIG,
        ...data.value,
      };
    }
  } catch (err) {
    console.warn("Could not fetch SMTP config from Supabase:", err);
  }
  return activeSmtpConfig;
}

if (typeof window !== "undefined") {
  fetchSmtpConfigFromDB();
}

export function getSmtpConfig() {
  return activeSmtpConfig;
}

export async function saveSmtpConfig(newSmtp) {
  const merged = {
    ...DEFAULT_SMTP_CONFIG,
    ...activeSmtpConfig,
    ...newSmtp,
  };
  activeSmtpConfig = merged;

  const { error } = await supabase.from("app_settings").upsert(
    {
      key: SMTP_STORAGE_KEY,
      value: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(error.message || "Failed to save SMTP configuration in database");
  }

  return merged;
}
