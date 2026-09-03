import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
}

/**
 * Labelled text input. Label is always visible (never placeholder-only) so the
 * field stays understandable after typing; errors are tied to the input via
 * aria-describedby so screen readers announce them.
 */
export function Field({ id, label, hint, error, className = "", ...rest }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={`focus-ring block min-h-[44px] w-full rounded-lg border bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 ${
          error ? "border-red-400" : "border-slate-300 hover:border-slate-400"
        } ${className}`}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
