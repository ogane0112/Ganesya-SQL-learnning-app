import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { problems } from "../data/problems";
import { loadProgress } from "../lib/progress";
import { useLocale } from "../lib/useLocale";
import type { ProgressStatus } from "../types/problem";
import { Badge, Card, Icon } from "../components/ui";

const STATUS_TONE: Record<ProgressStatus, "neutral" | "success" | "warning"> = {
  not_started: "neutral",
  correct: "success",
  incorrect: "warning",
};

export default function ProblemList() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [statusMap, setStatusMap] = useState<Record<string, ProgressStatus>>(
    {},
  );

  useEffect(() => {
    loadProgress().then((entries) => {
      const map: Record<string, ProgressStatus> = {};
      for (const e of entries) map[e.problemId] = e.status;
      setStatusMap(map);
    });
  }, []);

  const solvedCount = Object.values(statusMap).filter(
    (s) => s === "correct",
  ).length;
  const percent = problems.length
    ? Math.round((solvedCount / problems.length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("problemList.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{t("problemList.subtitle")}</p>
        </div>

        {/* Progress is the motivator on this screen, so it gets a real bar,
            not just a number. */}
        <div className="w-full sm:w-64">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-slate-700">
              {t("problemList.progressLabel")}
            </span>
            <span className="text-slate-600">
              {t("problemList.solvedCount", {
                solved: solvedCount,
                total: problems.length,
              })}
            </span>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={problems.length}
            aria-valuenow={solvedCount}
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <ol className="mt-8 space-y-3">
        {problems.map((p, index) => {
          const status = statusMap[p.id] ?? "not_started";
          const content = p.content[locale];
          return (
            <li key={p.id}>
              <Card className="transition-colors hover:border-blue-300">
                <Link
                  to={`/problems/${p.id}`}
                  className="focus-ring flex min-h-[44px] items-center gap-4 rounded-xl p-4"
                >
                  <span className="hidden w-8 shrink-0 font-mono text-sm text-slate-400 sm:block">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {content.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="table" size={14} className="text-slate-400" />
                        {content.category}
                      </span>
                      <DifficultyDots
                        level={p.difficulty}
                        label={t("problemList.difficulty")}
                      />
                    </div>
                  </div>
                  <Badge
                    tone={STATUS_TONE[status]}
                    icon={
                      status === "correct" ? (
                        <Icon name="check" size={12} />
                      ) : undefined
                    }
                    className="shrink-0"
                  >
                    {t(`problemList.status.${status}`)}
                  </Badge>
                  <Icon
                    name="chevronLeft"
                    size={16}
                    className="hidden shrink-0 rotate-180 text-slate-300 sm:block"
                  />
                </Link>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Difficulty as filled/empty dots rather than ★☆ glyphs — same visual weight
 * in every font, and the blue fill ties it to the rest of the palette.
 */
function DifficultyDots({ level, label }: { level: number; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      role="img"
      aria-label={`${label} ${level}/5`}
    >
      <span>{label}</span>
      <span className="inline-flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i < level ? "bg-blue-600" : "bg-slate-200"
            }`}
          />
        ))}
      </span>
    </span>
  );
}
