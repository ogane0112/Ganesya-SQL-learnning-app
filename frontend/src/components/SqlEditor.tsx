import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Editor, { loader, type Monaco, type OnMount } from "@monaco-editor/react";
// Slim Monaco: the editor core + only the SQL grammar, not the ~10MB of TS/CSS/
// HTML language services and every other language that the umbrella entry pulls.
import * as monaco from "monaco-editor/editor/editor.api";
import "monaco-editor/languages/definitions/sql/register";
import editorWorker from "monaco-editor/editor/editor.worker?worker";
import { Icon } from "./ui";

// Bundle Monaco with the app instead of pulling it from a CDN, and wire up the
// single web worker the plain-text/SQL editor needs (no TS/JSON/CSS services).
if (!(self as unknown as { __monacoEnvSet?: boolean }).__monacoEnvSet) {
  self.MonacoEnvironment = { getWorker: () => new editorWorker() };
  (self as unknown as { __monacoEnvSet?: boolean }).__monacoEnvSet = true;
  loader.config({ monaco });
}

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  schema?: Record<string, string[]>;
}

const THEME_NAME = "sql-learn-light";

/**
 * Light theme that shares the app palette: white surface, slate chrome,
 * blue-700 keywords (the same "blue = important" rule as the UI), emerald
 * strings and amber numbers so literals are visibly distinct from structure.
 */
function defineTheme(m: Monaco) {
  m.editor.defineTheme(THEME_NAME, {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword.sql", foreground: "1d4ed8", fontStyle: "bold" },
      { token: "operator.sql", foreground: "475569" },
      { token: "string.sql", foreground: "047857" },
      { token: "number.sql", foreground: "b45309" },
      { token: "comment.sql", foreground: "94a3b8", fontStyle: "italic" },
      { token: "predefined.sql", foreground: "6d28d9" },
      { token: "identifier.sql", foreground: "1e293b" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#1e293b",
      "editorLineNumber.foreground": "#cbd5e1",
      "editorLineNumber.activeForeground": "#64748b",
      "editor.lineHighlightBackground": "#eff6ff",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#bfdbfe",
      "editor.selectionHighlightBackground": "#dbeafe",
      "editor.inactiveSelectionBackground": "#e2e8f0",
      "editorCursor.foreground": "#2563eb",
      "editorIndentGuide.background1": "#f1f5f9",
      "editorIndentGuide.activeBackground1": "#e2e8f0",
      "editorWidget.background": "#ffffff",
      "editorWidget.border": "#e2e8f0",
      "editorSuggestWidget.background": "#ffffff",
      "editorSuggestWidget.border": "#e2e8f0",
      "editorSuggestWidget.selectedBackground": "#eff6ff",
      "editorSuggestWidget.selectedForeground": "#1e293b",
      "editorSuggestWidget.highlightForeground": "#1d4ed8",
      "scrollbarSlider.background": "#cbd5e180",
      "scrollbarSlider.hoverBackground": "#94a3b8aa",
      "scrollbarSlider.activeBackground": "#64748b",
      "focusBorder": "#00000000",
    },
  });
}

const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT",
  "OFFSET", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN",
  "ON", "AS", "AND", "OR", "NOT", "NULL", "IS NULL", "IS NOT NULL", "IN",
  "LIKE", "BETWEEN", "DISTINCT", "COUNT", "SUM", "AVG", "MIN", "MAX",
  "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE", "CASE", "WHEN",
  "THEN", "ELSE", "END", "UNION", "UNION ALL", "ASC", "DESC",
];

/** schema-aware autocompletion — one provider, kept fresh via a ref. */
function registerCompletion(
  m: Monaco,
  schemaRef: { current: Record<string, string[]> | undefined },
): monaco.IDisposable {
  return m.languages.registerCompletionItemProvider("sql", {
    provideCompletionItems: (
      model: monaco.editor.ITextModel,
      position: monaco.Position,
    ) => {
      const word = model.getWordUntilPosition(position);
      const range: monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const schema = schemaRef.current ?? {};
      const suggestions: monaco.languages.CompletionItem[] = [];

      for (const [table, columns] of Object.entries(schema)) {
        suggestions.push({
          label: table,
          kind: m.languages.CompletionItemKind.Struct,
          detail: "table",
          insertText: table,
          range,
        });
        for (const col of columns) {
          suggestions.push({
            label: col,
            kind: m.languages.CompletionItemKind.Field,
            detail: `${table}.${col}`,
            insertText: col,
            range,
          });
        }
      }
      for (const kw of SQL_KEYWORDS) {
        suggestions.push({
          label: kw,
          kind: m.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        });
      }
      return { suggestions };
    },
  });
}

export function SqlEditor({ value, onChange, onRun, schema }: SqlEditorProps) {
  const { t } = useTranslation();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const onRunRef = useRef(onRun);
  const schemaRef = useRef(schema);
  onRunRef.current = onRun;
  schemaRef.current = schema;

  const completionRef = useRef<monaco.IDisposable | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    return () => completionRef.current?.dispose();
  }, []);

  const handleMount: OnMount = (editor, m) => {
    editorRef.current = editor;
    defineTheme(m);
    m.editor.setTheme(THEME_NAME);

    completionRef.current?.dispose();
    completionRef.current = registerCompletion(m, schemaRef);

    editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Enter, () => {
      onRunRef.current?.();
    });
  };

  const insertSnippet = (text: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = editor.getSelection();
    if (!selection) return;
    editor.executeEdits("toolbar", [
      { range: selection, text, forceMoveMarkers: true },
    ]);
    editor.focus();
  };

  return (
    <div className="flex h-full flex-col">
      <MobileToolbar onInsert={insertSnippet} />

      <div className="relative min-h-0 flex-1">
        <Editor
          language="sql"
          theme={THEME_NAME}
          value={value}
          onChange={(v) => {
            const next = v ?? "";
            setIsEmpty(!next);
            onChange(next);
          }}
          onMount={handleMount}
          loading={
            <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
              <Icon name="spinner" size={16} />
              {t("problemSolve.editorLoading")}
            </div>
          }
          options={{
            fontFamily:
              "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 14,
            fontLigatures: true,
            lineHeight: 1.7,
            minimap: { enabled: false },
            padding: { top: 14, bottom: 14 },
            scrollBeyondLastLine: false,
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            roundedSelection: true,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            suggestFontSize: 13,
            renderWhitespace: "none",
          }}
        />
        {isEmpty && (
          <div className="pointer-events-none absolute left-[54px] top-[13px] select-none font-mono text-[13.5px] italic text-slate-400">
            SELECT * FROM ...
          </div>
        )}
      </div>
    </div>
  );
}

const SNIPPETS = [
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "ON",
  "GROUP BY",
  "ORDER BY",
  "AS",
  ",",
  "(",
  ")",
  "'",
  ";",
  "=",
];

/**
 * Tap-to-insert toolbar for SQL keywords/symbols that are painful to type via
 * mobile flick input (要件 9.7 SQL入力支援ツールバー). Always rendered; hidden
 * on wider viewports via CSS so PC users get the plain editor.
 */
function MobileToolbar({ onInsert }: { onInsert: (text: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-white p-2 md:hidden">
      {SNIPPETS.map((snippet) => (
        <button
          key={snippet}
          type="button"
          onClick={() => onInsert(snippet)}
          className="focus-ring min-h-[44px] shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-blue-700 active:bg-blue-50"
        >
          {snippet}
        </button>
      ))}
    </div>
  );
}
