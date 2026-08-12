import { useTranslation } from "react-i18next";
import type { QueryResultSet } from "../types/problem";

export function ResultTable({ result }: { result: QueryResultSet | null }) {
  const { t } = useTranslation();

  if (!result) {
    return <p className="p-4 text-sm text-slate-500">{t("resultTable.placeholder")}</p>;
  }
  if (result.columns.length === 0) {
    return <p className="p-4 text-sm text-slate-500">{t("resultTable.noResultSet")}</p>;
  }
  return (
    <div className="h-full overflow-auto">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-100">
          <tr>
            {result.columns.map((col) => (
              <th
                key={col}
                className="border-b border-slate-300 px-3 py-2 text-left font-semibold text-slate-700"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr key={i} className="odd:bg-white even:bg-slate-50">
              {row.map((cell, j) => (
                <td key={j} className="border-b border-slate-200 px-3 py-2 text-slate-800">
                  {cell === null ? (
                    <span className="italic text-slate-400">NULL</span>
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
        <p className="p-4 text-sm text-slate-500">{t("resultTable.zeroRows")}</p>
      )}
    </div>
  );
}
