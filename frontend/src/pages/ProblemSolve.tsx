import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Database } from "sql.js";
import { getProblemById } from "../data/problems";
import {
  createProblemDatabase,
  extractSchemaInfo,
  isResultCorrect,
  runQuery,
  SqlExecutionError,
} from "../lib/sqlEngine";
import type { ProgressEntry, QueryResultSet } from "../types/problem";
import { recordProgress } from "../lib/progress";
import { SqlEditor } from "../components/SqlEditor";
import { ResultTable } from "../components/ResultTable";

type MobileTab = "editor" | "result" | "schema";

const INCORRECT_ATTEMPTS_BEFORE_EXPLANATION = 3;

export default function ProblemSolve() {
  const { id } = useParams<{ id: string }>();
  const problem = id ? getProblemById(id) : undefined;

  const [db, setDb] = useState<Database | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [sqlText, setSqlText] = useState(problem?.sampleAnswer ? "" : "");
  const [result, setResult] = useState<QueryResultSet | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "incorrect">(
    "idle",
  );
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [revealedHints, setRevealedHints] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("editor");
  const resultPaneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setDb(null);
    setDbError(null);
    setResult(null);
    setRunError(null);
    setStatus("idle");
    setIncorrectCount(0);
    setRevealedHints(0);
    setShowExplanation(false);
    setSqlText("");
    if (!problem) return;
    createProblemDatabase(problem.schemaSql, problem.seedSql)
      .then((database) => {
        if (!cancelled) setDb(database);
      })
      .catch((err: Error) => {
        if (!cancelled) setDbError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [problem]);

  useEffect(() => {
    return () => {
      db?.close();
    };
  }, [db]);

  const schema = useMemo(() => {
    if (!db) return undefined;
    const info = extractSchemaInfo(db);
    return Object.fromEntries(info.map((t) => [t.table, t.columns]));
  }, [db]);

  if (!problem) {
    return (
      <div className="p-6">
        <p>問題が見つかりませんでした。</p>
        <Link to="/problems" className="text-blue-600 underline">
          問題一覧に戻る
        </Link>
      </div>
    );
  }

  const handleRun = () => {
    if (!db) return;
    // Reset to a fresh DB state per run so repeated INSERT/UPDATE attempts
    // are judged against the original seed data each time.
    createProblemDatabase(problem.schemaSql, problem.seedSql)
      .then(async (freshDb) => {
        try {
          const res = runQuery(freshDb, sqlText);
          setRunError(null);
          setResult(res);
          const correct = isResultCorrect(res, problem.expectedResult);
          setStatus(correct ? "correct" : "incorrect");
          if (!correct) {
            setIncorrectCount((c) => c + 1);
          }
          const entry: ProgressEntry = {
            problemId: problem.id,
            status: correct ? "correct" : "incorrect",
            lastSubmittedSql: sqlText,
            updatedAt: new Date().toISOString(),
          };
          await recordProgress(entry);
        } catch (err) {
          setResult(null);
          setRunError(
            err instanceof SqlExecutionError
              ? err.message
              : "予期しないエラーが発生しました。",
          );
        } finally {
          freshDb.close();
          setActiveTab("result");
          // 要件9.7: 実行後は結果エリアへスクロール（モバイルでキーボードが結果を隠す対策）
          resultPaneRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          (document.activeElement as HTMLElement | null)?.blur();
        }
      })
      .catch((err: Error) => setRunError(err.message));
  };

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 p-4">
      <div>
        <Link to="/problems" className="text-sm text-blue-600 underline">
          ← 問題一覧
        </Link>
        <h1 className="mt-1 text-xl font-bold">{problem.title}</h1>
        <p className="mt-1 whitespace-pre-wrap text-slate-700">
          {problem.description}
        </p>
      </div>

      {dbError && (
        <p className="rounded bg-red-50 p-3 text-red-700">{dbError}</p>
      )}

      {/* Mobile: tab switcher (要件9.7 タブ切り替え型レイアウト) */}
      <div className="flex gap-1 md:hidden" role="tablist">
        {(
          [
            ["editor", "エディタ"],
            ["result", "結果"],
            ["schema", "テーブル定義"],
          ] as [MobileTab, string][]
        ).map(([tab, label]) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`min-h-[44px] flex-1 rounded-t-md px-2 text-sm font-medium ${
              activeTab === tab
                ? "bg-white text-blue-700 shadow"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[2fr_2fr_1fr]">
        <section
          className={`min-h-[300px] flex-col md:flex ${activeTab === "editor" ? "flex" : "hidden md:flex"}`}
        >
          <div className="flex items-center justify-between pb-2">
            <h2 className="font-semibold text-slate-700">SQLエディタ</h2>
            <button
              onClick={handleRun}
              disabled={!db}
              className="min-h-[44px] rounded bg-blue-600 px-4 py-2 font-medium text-white shadow disabled:opacity-50"
            >
              実行 (Ctrl/Cmd+Enter)
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <SqlEditor value={sqlText} onChange={setSqlText} onRun={handleRun} schema={schema} />
          </div>
        </section>

        <section
          ref={resultPaneRef}
          className={`min-h-[300px] flex-col md:flex ${activeTab === "result" ? "flex" : "hidden md:flex"}`}
        >
          <h2 className="pb-2 font-semibold text-slate-700">実行結果</h2>
          {status !== "idle" && (
            <div
              className={`mb-2 rounded p-3 font-medium ${
                status === "correct"
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {status === "correct" ? "✅ 正解です！" : "❌ 不正解です。もう一度試してみましょう。"}
            </div>
          )}
          {runError && (
            <div className="mb-2 rounded bg-red-50 p-3 text-red-700">
              {runError}
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-auto rounded border border-slate-300 bg-white">
            <ResultTable result={result} />
          </div>

          <HintsAndExplanation
            problemId={problem.id}
            hints={problem.hints}
            explanation={problem.explanation}
            sampleAnswer={problem.sampleAnswer}
            revealedHints={revealedHints}
            onRevealHint={() => setRevealedHints((n) => n + 1)}
            showExplanation={showExplanation}
            onShowExplanation={() => setShowExplanation(true)}
            suggestExplanation={incorrectCount >= INCORRECT_ATTEMPTS_BEFORE_EXPLANATION}
          />
        </section>

        <section
          className={`min-h-[200px] flex-col md:flex ${activeTab === "schema" ? "flex" : "hidden md:flex"}`}
        >
          <h2 className="pb-2 font-semibold text-slate-700">テーブル定義</h2>
          <pre className="min-h-0 flex-1 overflow-auto rounded border border-slate-300 bg-white p-3 text-xs">
            {problem.schemaSql.trim()}
          </pre>
        </section>
      </div>
    </div>
  );
}

function HintsAndExplanation({
  hints,
  explanation,
  sampleAnswer,
  revealedHints,
  onRevealHint,
  showExplanation,
  onShowExplanation,
  suggestExplanation,
}: {
  problemId: string;
  hints: string[];
  explanation: string;
  sampleAnswer: string;
  revealedHints: number;
  onRevealHint: () => void;
  showExplanation: boolean;
  onShowExplanation: () => void;
  suggestExplanation: boolean;
}) {
  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-700">
          ヒント ({revealedHints}/{hints.length})
        </h3>
        {revealedHints < hints.length && (
          <button
            onClick={onRevealHint}
            className="min-h-[36px] rounded border border-blue-300 px-3 text-sm text-blue-700 hover:bg-blue-50"
          >
            次のヒントを見る
          </button>
        )}
        {!showExplanation && (
          <button
            onClick={onShowExplanation}
            className={`min-h-[36px] rounded px-3 text-sm ${
              suggestExplanation
                ? "bg-amber-500 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            答え・解説を見る
          </button>
        )}
      </div>
      {hints.slice(0, revealedHints).length > 0 && (
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
          {hints.slice(0, revealedHints).map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
      {showExplanation && (
        <div className="mt-2 space-y-2 rounded bg-slate-50 p-3 text-sm">
          <p className="whitespace-pre-wrap text-slate-700">{explanation}</p>
          <div>
            <p className="mb-1 font-medium text-slate-600">模範解答:</p>
            <pre className="overflow-auto rounded bg-slate-800 p-2 text-xs text-slate-100">
              {sampleAnswer}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
