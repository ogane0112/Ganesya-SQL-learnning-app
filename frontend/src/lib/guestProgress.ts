import type { ProgressEntry } from "../types/problem";

const STORAGE_KEY = "sql-app:guest-progress";

/**
 * Guest progress lives in localStorage only (no PII), and is migrated into
 * D1 on the first successful login/registration (要件 9.6, F-22).
 */
export function getGuestProgress(): ProgressEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveGuestProgress(entry: ProgressEntry): void {
  const all = getGuestProgress();
  const idx = all.findIndex((p) => p.problemId === entry.problemId);
  if (idx >= 0) {
    all[idx] = entry;
  } else {
    all.push(entry);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearGuestProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasGuestProgress(): boolean {
  return getGuestProgress().length > 0;
}
