export type Provider = "openai" | "google";

export interface AppSettings {
  provider: Provider;
  openaiKey: string;
  googleKey: string;
}

export const defaultSettings: AppSettings = {
  provider: "openai",
  openaiKey: "",
  googleKey: "",
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  const stored = localStorage.getItem("ai-cv-settings");
  if (stored) {
    try {
      return { ...defaultSettings, ...JSON.parse(stored) };
    } catch (e) {
      console.error("Failed to parse settings", e);
    }
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ai-cv-settings", JSON.stringify(settings));
}
