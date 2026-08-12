import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ja from "./locales/ja.json";

/**
 * MVP is Japanese-only (要件 9.5), but UI strings are routed through i18next
 * from the start so future locales only require adding a new resource file —
 * no component changes needed later.
 */
i18n.use(initReactI18next).init({
  resources: { ja: { translation: ja } },
  lng: "ja",
  fallbackLng: "ja",
  interpolation: { escapeValue: false },
});

export default i18n;
