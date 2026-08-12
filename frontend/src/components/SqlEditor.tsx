import { useEffect, useRef } from "react";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { sql, SQLite } from "@codemirror/lang-sql";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from "@codemirror/autocomplete";

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  schema?: Record<string, string[]>;
}

const schemaCompartment = new Compartment();

export function SqlEditor({ value, onChange, onRun, schema }: SqlEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        closeBrackets(),
        autocompletion(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        schemaCompartment.of(sql({ dialect: SQLite, schema })),
        placeholder("SELECT * FROM ..."),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          indentWithTab,
          {
            key: "Mod-Enter",
            run: () => {
              onRunRef.current?.();
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-content": { fontFamily: "ui-monospace, monospace" },
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep external value changes (e.g. switching problems) in sync.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  // Update autocomplete schema when the active problem changes.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: schemaCompartment.reconfigure(sql({ dialect: SQLite, schema })),
    });
  }, [schema]);

  const insertSnippet = (text: string) => {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
    view.focus();
  };

  return (
    <div className="flex h-full flex-col">
      <MobileToolbar onInsert={insertSnippet} />
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto rounded-b-md border border-slate-300 bg-white"
      />
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
    <div className="flex flex-wrap gap-1 border-b border-slate-300 bg-slate-100 p-1 md:hidden">
      {SNIPPETS.map((snippet) => (
        <button
          key={snippet}
          type="button"
          onClick={() => onInsert(snippet)}
          className="min-h-[44px] rounded bg-white px-3 py-1 font-mono text-sm text-slate-700 shadow-sm active:bg-slate-200"
        >
          {snippet}
        </button>
      ))}
    </div>
  );
}
