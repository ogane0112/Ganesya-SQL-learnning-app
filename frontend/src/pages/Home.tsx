import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { ButtonLink, Card, Icon } from "../components/ui";

const FEATURES = [
  { key: "instant", icon: "bolt" },
  { key: "private", icon: "shield" },
  { key: "guided", icon: "lightbulb" },
] as const;

/**
 * Landing: one clear promise, one primary action. The three feature cards
 * answer the three questions a new visitor has (is it fast? is it safe? will
 * I get help?) before they commit.
 */
export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          {t("home.eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {t("home.title")}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          {t("home.description")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink to="/problems" className="w-full px-6 sm:w-auto">
            {t("home.cta")}
            <Icon name="play" size={16} />
          </ButtonLink>
          {!user && (
            <ButtonLink to="/login" variant="secondary" className="w-full px-6 sm:w-auto">
              {t("home.secondaryCta")}
            </ButtonLink>
          )}
        </div>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ key, icon }) => (
          <Card key={key} className="p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon name={icon} />
            </span>
            <h2 className="mt-4 font-semibold text-slate-900">
              {t(`home.features.${key}.title`)}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {t(`home.features.${key}.body`)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
