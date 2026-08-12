import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from "../i18n";

/** Current UI locale, narrowed to the app's supported content locales. */
export function useLocale(): Locale {
  const { i18n } = useTranslation();
  return isSupportedLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE;
}
