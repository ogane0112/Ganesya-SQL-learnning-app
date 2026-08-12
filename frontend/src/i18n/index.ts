import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ja from "./locales/ja.json";
import en from "./locales/en.json";

export const SUPPORTED_LOCALES = ["ja", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";

const LOCALE_STORAGE_KEY = "sql-app:locale";

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Locale resolution order: explicit user choice (persisted) > browser
 * language > default (要件9.5: 日本語をデフォルトとしつつ将来の多言語化に対応)。
 */
function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isSupportedLocale(stored)) return stored;
  const browserLang = window.navigator.language?.slice(0, 2);
  if (isSupportedLocale(browserLang)) return browserLang;
  return DEFAULT_LOCALE;
}

i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
  },
  lng: detectInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined" && isSupportedLocale(lng)) {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  }
});

export default i18n;
