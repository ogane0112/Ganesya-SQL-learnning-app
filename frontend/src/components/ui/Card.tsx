import type { ComponentProps, ReactNode } from "react";

/**
 * The one surface used everywhere: white, 1px slate border, 12px radius,
 * barely-there shadow. Elevation comes from the border, not a drop shadow, so
 * many cards side by side still read as calm.
 */
export function Card({
  className = "",
  children,
  ...rest
}: ComponentProps<"section"> & { children: ReactNode }) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

/**
 * Card header: eyebrow-style title on the left, optional actions on the right.
 * Same height on every card so headers line up across a grid.
 */
export function CardHeader({
  title,
  icon,
  actions,
  className = "",
}: {
  title: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`flex min-h-[52px] shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50/60 px-4 py-2 ${className}`}
    >
      {icon && <span className="text-slate-400">{icon}</span>}
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
