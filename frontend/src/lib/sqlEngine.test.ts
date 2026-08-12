import { describe, it, expect, afterEach } from "vitest";
import type { Database } from "sql.js";
import {
  createProblemDatabase,
  runQuery,
  isResultCorrect,
  extractSchemaInfo,
  SqlExecutionError,
} from "./sqlEngine";

describe("sqlEngine", () => {
  let db: Database | null = null;

  afterEach(() => {
    db?.close();
    db = null;
  });

  it("creates a database from schema+seed SQL and runs a query", async () => {
    db = await createProblemDatabase(
      "CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT);",
      "INSERT INTO t (id, name) VALUES (1, 'a'), (2, 'b');",
    );
    const result = runQuery(db, "SELECT * FROM t ORDER BY id;");
    expect(result.columns).toEqual(["id", "name"]);
    expect(result.rows).toEqual([
      [1, "a"],
      [2, "b"],
    ]);
  });

  it("throws SqlExecutionError with a readable message on invalid SQL", async () => {
    db = await createProblemDatabase("CREATE TABLE t (id INTEGER);", "");
    expect(() => runQuery(db!, "SELECT * FROM nonexistent;")).toThrow(
      SqlExecutionError,
    );
  });

  it("throws SqlExecutionError on empty input", async () => {
    db = await createProblemDatabase("CREATE TABLE t (id INTEGER);", "");
    expect(() => runQuery(db!, "   ")).toThrow(SqlExecutionError);
  });

  it("returns an empty result set for statements without rows (INSERT)", async () => {
    db = await createProblemDatabase("CREATE TABLE t (id INTEGER);", "");
    const result = runQuery(db, "INSERT INTO t (id) VALUES (1);");
    expect(result).toEqual({ columns: [], rows: [] });
  });

  it("extracts schema info (tables + columns) for autocomplete", async () => {
    db = await createProblemDatabase(
      "CREATE TABLE employees (id INTEGER, name TEXT); CREATE TABLE depts (id INTEGER);",
      "",
    );
    const info = extractSchemaInfo(db);
    const tableNames = info.map((t) => t.table).sort();
    expect(tableNames).toEqual(["depts", "employees"]);
    const employees = info.find((t) => t.table === "employees");
    expect(employees?.columns).toEqual(["id", "name"]);
  });

  describe("isResultCorrect", () => {
    it("matches identical column/row data", () => {
      const a = { columns: ["a", "b"], rows: [[1, "x"]] };
      const b = { columns: ["a", "b"], rows: [[1, "x"]] };
      expect(isResultCorrect(a, b)).toBe(true);
    });

    it("is case-insensitive on column names", () => {
      const a = { columns: ["Name"], rows: [["x"]] };
      const b = { columns: ["name"], rows: [["x"]] };
      expect(isResultCorrect(a, b)).toBe(true);
    });

    it("fails when row order differs", () => {
      const a = { columns: ["a"], rows: [[1], [2]] };
      const b = { columns: ["a"], rows: [[2], [1]] };
      expect(isResultCorrect(a, b)).toBe(false);
    });

    it("fails when row count differs", () => {
      const a = { columns: ["a"], rows: [[1]] };
      const b = { columns: ["a"], rows: [[1], [2]] };
      expect(isResultCorrect(a, b)).toBe(false);
    });

    it("treats null and NULL-like values consistently", () => {
      const a = { columns: ["a"], rows: [[null]] };
      const b = { columns: ["a"], rows: [[null]] };
      expect(isResultCorrect(a, b)).toBe(true);
    });
  });
});
