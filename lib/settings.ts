export type Provider = "openai" | "google" | "anthropic";

export const AI_MODEL_OPTIONS: Record<Provider, Array<{ label: string; value: string }>> = {
  openai: [
    { label: "GPT-4o mini", value: "gpt-4o-mini" },
    { label: "GPT-4o", value: "gpt-4o" },
    { label: "GPT-4.1 mini", value: "gpt-4.1-mini" },
  ],
  google: [
    { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
    { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
    { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
  ],
  anthropic: [
    { label: "Claude Sonnet 4.5", value: "claude-sonnet-4-5-20250929" },
    { label: "Claude Sonnet 4", value: "claude-sonnet-4-20250514" },
    { label: "Claude Opus 4.1", value: "claude-opus-4-1-20250805" },
    { label: "Claude Haiku 4.5", value: "claude-haiku-4-5-20251001" },
  ],
};

export interface AppSettings {
  provider: Provider;
  openaiKey: string;
  googleKey: string;
  anthropicKey: string;
  openaiModel: string;
  googleModel: string;
  anthropicModel: string;
  debugLogging: boolean;
}

export const defaultSettings: AppSettings = {
  provider: "openai",
  openaiKey: "",
  googleKey: "",
  anthropicKey: "",
  openaiModel: "gpt-4o-mini",
  googleModel: "gemini-2.5-pro",
  anthropicModel: "claude-sonnet-4-5-20250929",
  debugLogging: false,
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

export function getProviderApiKey(settings: AppSettings): string {
  if (settings.provider === "google") return settings.googleKey;
  if (settings.provider === "anthropic") return settings.anthropicKey;
  return settings.openaiKey;
}

export function getProviderModel(settings: AppSettings): string {
  if (settings.provider === "google") return settings.googleModel || defaultSettings.googleModel;
  if (settings.provider === "anthropic") return settings.anthropicModel || defaultSettings.anthropicModel;
  return settings.openaiModel || defaultSettings.openaiModel;
}
