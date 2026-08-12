import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES, type Locale } from "../i18n";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <label className="flex items-center gap-1 text-sm text-slate-600">
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="min-h-[44px] rounded border border-slate-300 bg-white px-2 py-1 text-sm"
        aria-label={t("language.label")}
      >
        {SUPPORTED_LOCALES.map((locale: Locale) => (
          <option key={locale} value={locale}>
            {t(`language.${locale}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
