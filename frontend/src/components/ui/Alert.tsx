import type { ReactNode } from "react";
import { Icon } from "./Icon";

export type AlertTone = "info" | "success" | "warning" | "danger";

/*
 * Feedback banners. Tone is chosen by *meaning*, consistently across the app:
 *   success — the answer was judged correct
 *   warning — the answer was judged incorrect (part of learning, not a failure)
 *   danger  — something broke (SQL error, network, initialization)
 *   info    — neutral guidance
 */
const TONE: Record<AlertTone, { box: string; icon: "info" | "check" | "alert" | "x" }> = {
  info: { box: "border-blue-200 bg-blue-50 text-blue-800", icon: "info" },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: "check" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-800", icon: "alert" },
  danger: { box: "border-red-200 bg-red-50 text-red-800", icon: "x" },
};

export function Alert({
  tone = "info",
  children,
  className = "",
  role,
}: {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
  role?: "status" | "alert";
}) {
  const { box, icon } = TONE[tone];
  return (
    <div
      role={role ?? (tone === "danger" ? "alert" : "status")}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${box} ${className}`}
    >
      <Icon name={icon} size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
