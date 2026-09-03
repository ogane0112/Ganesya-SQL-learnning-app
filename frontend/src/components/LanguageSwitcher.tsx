import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES, type Locale } from "../i18n";
import { Icon } from "./ui";

/**
 * Native <select> (best keyboard + mobile behaviour) dressed as a quiet
 * ghost control so it doesn't compete with the primary nav actions.
 */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <label className="relative inline-flex items-center text-sm text-slate-600">
      <span className="sr-only">{t("language.label")}</span>
      <Icon
        name="globe"
        size={16}
        className="pointer-events-none absolute left-2.5 text-slate-400"
      />
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        aria-label={t("language.label")}
        className="focus-ring min-h-[44px] cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent py-1 pl-8 pr-7 text-sm font-medium text-slate-600 hover:border-slate-200 hover:bg-slate-50"
      >
        {SUPPORTED_LOCALES.map((locale: Locale) => (
          <option key={locale} value={locale}>
            {t(`language.${locale}`)}
          </option>
        ))}
      </select>
      <Icon
        name="chevronDown"
        size={14}
        className="pointer-events-none absolute right-2 text-slate-400"
      />
    </label>
  );
}
