import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Database } from "sql.js";
import { getProblemById, problems } from "../data/problems";
import {
  createProblemDatabase,
  extractSchemaInfo,
  isResultCorrect,
  runQuery,
  SqlExecutionError,
} from "../lib/sqlEngine";
import type { ProgressEntry, QueryResultSet } from "../types/problem";
import { recordProgress } from "../lib/progress";
import { useLocale } from "../lib/useLocale";
import { SqlEditor } from "../components/SqlEditor";
import { ResultTable } from "../components/ResultTable";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  Icon,
} from "../components/ui";

type MobileTab = "editor" | "result" | "schema";

const INCORRECT_ATTEMPTS_BEFORE_EXPLANATION = 3;

/**
 * Solve screen. Layout mirrors the workflow:
 *   read the problem (top)  →  reference the schema (left)
 *   →  write SQL (right, top)  →  see the result (right, below)
 *   →  get help where the failure is shown (hints, under the result)
 * On phones the same three regions become tabs (要件 9.7).
 */
export default function ProblemSolve() {
  const { id } = useParams<{ id: string }>();
  const problem = id ? getProblemById(id) : undefined;
  const { t } = useTranslation();
  const locale = useLocale();
  const content = problem?.content[locale];

  const [db, setDb] = useState<Database | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [sqlText, setSqlText] = useState("");
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
    setActiveTab("editor");
    if (!problem || !content) return;
    createProblemDatabase(problem.schemaSql, content.seedSql)
      .then((database) => {
        if (!cancelled) setDb(database);
      })
      .catch((err: Error) => {
        if (!cancelled) setDbError(err.message);
      });
    return () => {
      cancelled = true;
    };
    // Re-seed with locale-appropriate data when the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, locale]);

  useEffect(() => {
    return () => {
      db?.close();
    };
  }, [db]);

  const schemaInfo = useMemo(() => (db ? extractSchemaInfo(db) : []), [db]);
  const schema = useMemo(
    () =>
      db
        ? Object.fromEntries(schemaInfo.map((s) => [s.table, s.columns]))
        : undefined,
    [db, schemaInfo],
  );

  const problemIndex = problem ? problems.findIndex((p) => p.id === problem.id) : -1;
  const nextProblem =
    problemIndex >= 0 && problemIndex < problems.length - 1
      ? problems[problemIndex + 1]
      : undefined;

  if (!problem || !content) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-slate-700">{t("problemSolve.notFound")}</p>
        <ButtonLink to="/problems" variant="secondary" className="mt-4">
          {t("problemSolve.backToList")}
        </ButtonLink>
      </div>
    );
  }

  const handleRun = () => {
    if (!db) return;
    // Reset to a fresh DB state per run so repeated INSERT/UPDATE attempts
    // are judged against the original seed data each time.
    createProblemDatabase(problem.schemaSql, content.seedSql)
      .then(async (freshDb) => {
        try {
          const res = runQuery(freshDb, sqlText);
          setRunError(null);
          setResult(res);
          const correct = isResultCorrect(res, content.expectedResult);
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
              : t("problemSolve.unexpectedError"),
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

  // The Run button lives in the editor toolbar — right next to the thing it
  // acts on — and is the single primary action on this screen.
  const runButton = (
    <Button onClick={handleRun} disabled={!db}>
      {db ? <Icon name="play" size={16} /> : <Icon name="spinner" size={16} />}
      {t("problemSolve.run")}
    </Button>
  );

  const suggestExplanation = incorrectCount >= INCORRECT_ATTEMPTS_BEFORE_EXPLANATION;

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      {/* Problem statement — always visible, on every viewport. */}
      <div>
        <Link
          to="/problems"
          className="focus-ring inline-flex min-h-[36px] items-center gap-1 rounded-lg text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {t("problemSolve.backToList")}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-slate-400">
            #{String(problemIndex + 1).padStart(2, "0")}
          </span>
          <Badge tone="brand">{content.category}</Badge>
          <span
            className="inline-flex items-center gap-1.5 text-xs text-slate-500"
            aria-label={`${t("problemList.difficulty")} ${problem.difficulty}/5`}
          >
            {t("problemList.difficulty")}
            <span className="inline-flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i < problem.difficulty ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              ))}
            </span>
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {content.title}
        </h1>
        <p className="mt-2 max-w-3xl whitespace-pre-wrap leading-relaxed text-slate-700">
          {content.description}
        </p>
      </div>

      {dbError && <Alert tone="danger">{dbError}</Alert>}

      {/* Mobile: tab switcher (要件9.7 タブ切り替え型レイアウト) */}
      <div
        className="flex gap-1 rounded-lg bg-slate-200/70 p-1 lg:hidden"
        role="tablist"
      >
        {(
          [
            ["editor", t("problemSolve.tabs.editor")],
            ["result", t("problemSolve.tabs.result")],
            ["schema", t("problemSolve.tabs.schema")],
          ] as [MobileTab, string][]
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`focus-ring min-h-[40px] flex-1 rounded-md px-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* Reference column */}
        <Card
          className={`lg:sticky lg:top-6 lg:self-start ${
            activeTab === "schema" ? "flex" : "hidden lg:flex"
          }`}
        >
          <CardHeader
            title={t("problemSolve.schemaHeading")}
            icon={<Icon name="table" size={18} />}
          />
          <div className="divide-y divide-slate-100">
            {schemaInfo.length === 0 ? (
              <p className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <Icon name="spinner" size={16} />
                {t("problemSolve.preparing")}
              </p>
            ) : (
              schemaInfo.map(({ table, columns }) => (
                <div key={table} className="p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="font-mono text-sm font-semibold text-slate-900">{table}</p>
                    <span className="text-xs text-slate-400">
                      {t("problemSolve.columnsCount", { count: columns.length })}
                    </span>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {columns.map((col) => (
                      <li
                        key={col}
                        className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700"
                      >
                        {col}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
          <details className="group border-t border-slate-200">
            <summary className="focus-ring flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 px-4 text-sm text-slate-600 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              <Icon
                name="chevronDown"
                size={14}
                className="transition-transform group-open:rotate-180"
              />
              {t("problemSolve.showDdl")}
            </summary>
            <pre className="overflow-auto border-t border-slate-100 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700">
              {problem.schemaSql.trim()}
            </pre>
          </details>
        </Card>

        {/* Work column */}
        <div className="flex min-h-0 flex-col gap-6">
          <Card
            className={`min-h-[360px] ${
              activeTab === "editor" ? "flex" : "hidden lg:flex"
            }`}
          >
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  {t("problemSolve.editorHeading")}
                  <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-normal text-slate-500 lg:inline">
                    Ctrl/⌘ + ⏎
                  </kbd>
                </span>
              }
              icon={<Icon name="database" size={18} />}
              actions={runButton}
            />
            <div className="min-h-0 flex-1">
              <SqlEditor
                value={sqlText}
                onChange={setSqlText}
                onRun={handleRun}
                schema={schema}
              />
            </div>
          </Card>

          <Card
            ref={resultPaneRef}
            className={`min-h-[280px] scroll-mt-4 ${
              activeTab === "result" ? "flex" : "hidden lg:flex"
            }`}
          >
            <CardHeader
              title={t("problemSolve.resultHeading")}
              icon={<Icon name="database" size={18} />}
              actions={
                result && result.columns.length > 0 ? (
                  <span className="text-xs text-slate-500">
                    {t("problemSolve.rowsCount", { count: result.rows.length })}
                  </span>
                ) : undefined
              }
            />
            {(status !== "idle" || runError) && (
              <div className="space-y-2 border-b border-slate-200 p-3">
                {status === "correct" && (
                  <Alert tone="success">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{t("problemSolve.correct")}</span>
                      {nextProblem && (
                        <ButtonLink
                          to={`/problems/${nextProblem.id}`}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                        >
                          {t("problemSolve.correctNext")}
                          <Icon name="chevronLeft" size={14} className="rotate-180" />
                        </ButtonLink>
                      )}
                    </div>
                  </Alert>
                )}
                {status === "incorrect" && !runError && (
                  <Alert tone="warning">
                    <span className="font-medium">{t("problemSolve.incorrect")}</span>
                  </Alert>
                )}
                {runError && (
                  <Alert tone="danger">
                    <code className="font-mono text-xs">{runError}</code>
                  </Alert>
                )}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-auto">
              <ResultTable result={result} />
            </div>
            <HintsAndExplanation
              hints={content.hints}
              explanation={content.explanation}
              sampleAnswer={content.sampleAnswer}
              revealedHints={revealedHints}
              onRevealHint={() => setRevealedHints((n) => n + 1)}
              showExplanation={showExplanation}
              onShowExplanation={() => setShowExplanation(true)}
              suggestExplanation={suggestExplanation}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Help lives directly under the result: the moment a user sees "incorrect"
 * is the moment they want a hint. Hints are revealed one at a time and the
 * answer is a deliberately quieter, secondary action — until three misses,
 * when it's promoted so nobody stays stuck.
 */
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
  hints: string[];
  explanation: string;
  sampleAnswer: string;
  revealedHints: number;
  onRevealHint: () => void;
  showExplanation: boolean;
  onShowExplanation: () => void;
  suggestExplanation: boolean;
}) {
  const { t } = useTranslation();
  const shown = hints.slice(0, revealedHints);
  return (
    <div className="border-t border-slate-200 bg-slate-50/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Icon name="lightbulb" size={16} className="text-amber-500" />
          {t("problemSolve.hints.heading", {
            revealed: revealedHints,
            total: hints.length,
          })}
        </h3>
        {revealedHints < hints.length && (
          <Button variant="secondary" size="sm" onClick={onRevealHint}>
            {t("problemSolve.hints.next")}
          </Button>
        )}
        {!showExplanation && (
          <Button
            variant={suggestExplanation ? "primary" : "ghost"}
            size="sm"
            onClick={onShowExplanation}
          >
            {t("problemSolve.hints.showAnswer")}
          </Button>
        )}
      </div>

      {suggestExplanation && !showExplanation && (
        <p className="mt-2 text-xs text-slate-600">{t("problemSolve.hints.suggest")}</p>
      )}

      {shown.length > 0 && (
        <ol className="mt-3 space-y-2">
          {shown.map((h, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-slate-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 font-mono text-[11px] font-semibold text-amber-700">
                {i + 1}
              </span>
              <span className="leading-relaxed">{h}</span>
            </li>
          ))}
        </ol>
      )}

      {showExplanation && (
        <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{explanation}</p>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("problemSolve.hints.sampleAnswerLabel")}
            </p>
            <pre className="overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
              {sampleAnswer}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
