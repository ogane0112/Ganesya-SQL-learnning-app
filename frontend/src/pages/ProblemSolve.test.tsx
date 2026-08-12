import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProblemSolve from "./ProblemSolve";
import * as progressLib from "../lib/progress";
import i18n from "../i18n";

// CodeMirror 6 relies on DOM text-measurement APIs (getClientRects etc.) that
// jsdom doesn't implement, making simulated typing into it unreliable in
// tests. Swap it for a plain textarea here so this file can focus on
// ProblemSolve's own run/judge/record logic, which is what's under test —
// the editor's own rendering/toolbar behavior is covered manually (see
// README) and isn't this file's concern.
vi.mock("../components/SqlEditor", () => ({
  SqlEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <textarea
      aria-label="SQL入力"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

function renderProblem(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/problems/${id}`]}>
      <Routes>
        <Route path="/problems/:id" element={<ProblemSolve />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProblemSolve", () => {
  beforeEach(() => {
    vi.spyOn(progressLib, "recordProgress").mockResolvedValue(undefined);
  });

  it("renders the problem title, description and schema", async () => {
    renderProblem("p001");
    expect(screen.getByText("全件取得する（SELECT *）")).toBeInTheDocument();
    expect(
      screen.getByText(/employees.*テーブルからすべての列/),
    ).toBeInTheDocument();
    expect(await screen.findByText(/CREATE TABLE employees/)).toBeInTheDocument();
  });

  it("shows a not-found message for an unknown problem id", () => {
    renderProblem("does-not-exist");
    expect(screen.getByText("問題が見つかりませんでした。")).toBeInTheDocument();
  });

  it("enables the run button once the in-browser database is ready, and reports an empty-SQL error", async () => {
    renderProblem("p001");
    const runButton = await screen.findByRole(
      "button",
      { name: /実行/ },
      { timeout: 3000 },
    );
    await waitFor(() => expect(runButton).toBeEnabled());

    const user = userEvent.setup();
    await user.click(runButton);

    expect(
      await screen.findByText("SQLが入力されていません。"),
    ).toBeInTheDocument();
    // SQL execution errors short-circuit before progress is recorded.
    expect(progressLib.recordProgress).not.toHaveBeenCalled();
  });

  it("judges a correct submission and records progress", async () => {
    renderProblem("p001");
    const runButton = await screen.findByRole(
      "button",
      { name: /実行/ },
      { timeout: 3000 },
    );
    await waitFor(() => expect(runButton).toBeEnabled());

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("SQL入力"),
      "SELECT * FROM employees;",
    );
    await user.click(runButton);

    expect(await screen.findByText("✅ 正解です！")).toBeInTheDocument();
    await waitFor(() =>
      expect(progressLib.recordProgress).toHaveBeenCalledWith(
        expect.objectContaining({ problemId: "p001", status: "correct" }),
      ),
    );
  });

  describe("when the locale is switched to English", () => {
    afterEach(async () => {
      await i18n.changeLanguage("ja");
    });

    it("renders English problem content and re-seeds English data (要件9.5)", async () => {
      await i18n.changeLanguage("en");
      renderProblem("p001");

      expect(screen.getByText("Select all rows (SELECT *)")).toBeInTheDocument();
      expect(screen.getByText("Run (Ctrl/Cmd+Enter)")).toBeInTheDocument();

      const runButton = await screen.findByRole(
        "button",
        { name: /Run/ },
        { timeout: 3000 },
      );
      await waitFor(() => expect(runButton).toBeEnabled());

      const user = userEvent.setup();
      await user.type(
        screen.getByLabelText("SQL入力"),
        "SELECT * FROM employees;",
      );
      await user.click(runButton);

      // English locale seeds English employee names, not the Japanese seed data.
      expect(await screen.findByText("Smith")).toBeInTheDocument();
      expect(screen.getByText("✅ Correct!")).toBeInTheDocument();
    });
  });
});
