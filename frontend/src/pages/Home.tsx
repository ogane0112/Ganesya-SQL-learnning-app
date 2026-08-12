import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="text-2xl font-bold">{t("home.title")}</h1>
      <p className="mt-3 text-slate-600">{t("home.description")}</p>
      <Link
        to="/problems"
        className="mt-6 inline-block min-h-[44px] rounded-lg bg-blue-600 px-6 py-3 font-medium text-white"
      >
        {t("home.cta")}
      </Link>
    </div>
  );
}
