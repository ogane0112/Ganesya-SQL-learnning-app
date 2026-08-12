import { describe, it, expect, beforeEach } from "vitest";
import {
  getGuestProgress,
  saveGuestProgress,
  clearGuestProgress,
  hasGuestProgress,
} from "./guestProgress";
import type { ProgressEntry } from "../types/problem";

describe("guestProgress", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns an empty array when nothing is stored", () => {
    expect(getGuestProgress()).toEqual([]);
    expect(hasGuestProgress()).toBe(false);
  });

  it("saves a new entry", () => {
    const entry: ProgressEntry = {
      problemId: "p001",
      status: "correct",
      lastSubmittedSql: "SELECT 1;",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    saveGuestProgress(entry);
    expect(getGuestProgress()).toEqual([entry]);
    expect(hasGuestProgress()).toBe(true);
  });

  it("overwrites an existing entry for the same problemId", () => {
    saveGuestProgress({
      problemId: "p001",
      status: "incorrect",
      lastSubmittedSql: "SELECT 1;",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    saveGuestProgress({
      problemId: "p001",
      status: "correct",
      lastSubmittedSql: "SELECT 2;",
      updatedAt: "2026-01-02T00:00:00Z",
    });
    const all = getGuestProgress();
    expect(all).toHaveLength(1);
    expect(all[0].status).toBe("correct");
    expect(all[0].lastSubmittedSql).toBe("SELECT 2;");
  });

  it("keeps entries for different problems separate", () => {
    saveGuestProgress({
      problemId: "p001",
      status: "correct",
      lastSubmittedSql: "SELECT 1;",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    saveGuestProgress({
      problemId: "p002",
      status: "incorrect",
      lastSubmittedSql: "SELECT 2;",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    expect(getGuestProgress()).toHaveLength(2);
  });

  it("clears all stored progress", () => {
    saveGuestProgress({
      problemId: "p001",
      status: "correct",
      lastSubmittedSql: "SELECT 1;",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    clearGuestProgress();
    expect(getGuestProgress()).toEqual([]);
  });

  it("gracefully handles corrupted localStorage content", () => {
    localStorage.setItem("sql-app:guest-progress", "{not valid json");
    expect(getGuestProgress()).toEqual([]);
  });
});
