import type { ProgressEntry } from "../types/problem";
import { api } from "./api";
import { getGuestProgress, saveGuestProgress } from "./guestProgress";
import { getToken } from "./api";

export async function loadProgress(): Promise<ProgressEntry[]> {
  if (getToken()) {
    try {
      const { progress } = await api.getProgress();
      return progress;
    } catch {
      return [];
    }
  }
  return getGuestProgress();
}

export async function recordProgress(entry: ProgressEntry): Promise<void> {
  if (getToken()) {
    await api.saveProgress(entry);
  } else {
    saveGuestProgress(entry);
  }
}
