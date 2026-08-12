import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProblemList from "./ProblemList";
import { problems } from "../data/problems";
import * as progressLib from "../lib/progress";

describe("ProblemList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders every problem title", async () => {
    vi.spyOn(progressLib, "loadProgress").mockResolvedValue([]);
    render(
      <MemoryRouter>
        <ProblemList />
      </MemoryRouter>,
    );
    for (const p of problems) {
      expect(await screen.findByText(p.content.ja.title)).toBeInTheDocument();
    }
  });

  it("shows the solved count and per-problem status badges", async () => {
    vi.spyOn(progressLib, "loadProgress").mockResolvedValue([
      {
        problemId: problems[0].id,
        status: "correct",
        lastSubmittedSql: "SELECT 1;",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        problemId: problems[1].id,
        status: "incorrect",
        lastSubmittedSql: "SELECT 1;",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]);
    render(
      <MemoryRouter>
        <ProblemList />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(
        screen.getByText(`1 / ${problems.length} 問 正解済み`),
      ).toBeInTheDocument(),
    );
    expect(screen.getAllByText("正解")).toHaveLength(1);
    expect(screen.getAllByText("不正解")).toHaveLength(1);
    expect(screen.getAllByText("未着手")).toHaveLength(problems.length - 2);
  });
});
