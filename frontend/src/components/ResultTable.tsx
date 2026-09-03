import { useTranslation } from "react-i18next";
import type { QueryResultSet } from "../types/problem";
import { Icon } from "./ui";

/**
 * Query result grid. Numbers are right-aligned with tabular figures so
 * columns of values line up; NULL is rendered as a muted badge so it can't
 * be mistaken for the literal string "NULL".
 */
export function ResultTable({ result }: { result: QueryResultSet | null }) {
  const { t } = useTranslation();

  if (!result) {
    return <EmptyState icon="play" text={t("resultTable.placeholder")} />;
  }
  if (result.columns.length === 0) {
    return <EmptyState icon="info" text={t("resultTable.noResultSet")} />;
  }
  return (
    <div className="h-full overflow-auto">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            {result.columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="border-b border-slate-200 px-3 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-2 text-slate-800 ${
                    typeof cell === "number" ? "text-right tabular-nums" : ""
                  }`}
                >
                  {cell === null ? (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-400">
                      NULL
                    </span>
                  ) : (
                    String(cell)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {result.rows.length === 0 && (
        <EmptyState icon="info" text={t("resultTable.zeroRows")} />
      )}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: "play" | "info"; text: string }) {
  return (
    <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 p-6 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon name={icon} size={18} />
      </span>
      <p className="max-w-sm text-sm text-slate-500">{text}</p>
    </div>
  );
}
