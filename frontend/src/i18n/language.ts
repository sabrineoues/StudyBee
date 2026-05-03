export type LanguageCode = "en" | "fr";

const LANGUAGE_STORAGE_KEY = "studybee_language";

export function normalizeLanguage(value: unknown): LanguageCode {
  return value === "fr" ? "fr" : "en";
}

export function getStoredLanguage(): LanguageCode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!raw) return null;
    return normalizeLanguage(raw);
  } catch {
    return null;
  }
}

export function storeLanguage(code: LanguageCode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // ignore
  }
}
