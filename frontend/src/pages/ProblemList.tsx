import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { problems } from "../data/problems";
import { loadProgress } from "../lib/progress";
import { useLocale } from "../lib/useLocale";
import type { ProgressStatus } from "../types/problem";

const STATUS_STYLE: Record<ProgressStatus, string> = {
  not_started: "bg-slate-100 text-slate-600",
  correct: "bg-green-100 text-green-700",
  incorrect: "bg-amber-100 text-amber-700",
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

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="text-xl font-bold">{t("problemList.title")}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {t("problemList.solvedCount", { solved: solvedCount, total: problems.length })}
      </p>
      <ul className="mt-4 space-y-2">
        {problems.map((p) => {
          const status = statusMap[p.id] ?? "not_started";
          const content = p.content[locale];
          return (
            <li key={p.id}>
              <Link
                to={`/problems/${p.id}`}
                className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow"
              >
                <div>
                  <p className="font-medium text-slate-800">{content.title}</p>
                  <p className="text-xs text-slate-500">
                    {content.category} ・ {t("problemList.difficulty")}{" "}
                    {"★".repeat(p.difficulty)}
                    {"☆".repeat(5 - p.difficulty)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[status]}`}
                >
                  {t(`problemList.status.${status}`)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
