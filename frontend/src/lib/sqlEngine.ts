import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import i18n from "../i18n";
import type { QueryResultSet } from "../types/problem";

let sqlJsPromise: Promise<SqlJsStatic> | undefined;

function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs(
      // In the browser, the wasm binary is served from /public (copied from
      // node_modules/sql.js/dist). Under Vitest, `window` exists (jsdom) but
      // there's no dev server, so omit locateFile and let sql.js fall back
      // to its own fs-relative default resolution instead.
      import.meta.env.VITEST
        ? undefined
        : { locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}` },
    );
  }
  return sqlJsPromise;
}

export class SqlExecutionError extends Error {}

/**
 * Creates a fresh in-browser SQLite database for a single problem and loads
 * its schema + seed data. All learner SQL runs against this instance only —
 * nothing is ever sent to a server (要件 F-02, F-03).
 */
export async function createProblemDatabase(
  schemaSql: string,
  seedSql: string,
): Promise<Database> {
  const SQL = await loadSqlJs();
  const db = new SQL.Database();
  try {
    db.run(schemaSql);
    if (seedSql.trim()) {
      db.run(seedSql);
    }
  } catch (err) {
    db.close();
    throw new SqlExecutionError(
      i18n.t("sqlEngine.initError", { message: (err as Error).message }),
    );
  }
  return db;
}

/**
 * Runs a learner-submitted SQL string against the given database and
 * returns the first result set in a normalized shape, or throws
 * SqlExecutionError with a readable message on failure (要件 F-04, F-05).
 */
export function runQuery(db: Database, sql: string): QueryResultSet {
  if (!sql.trim()) {
    throw new SqlExecutionError(i18n.t("sqlEngine.emptyInput"));
  }
  try {
    const results = db.exec(sql);
    if (results.length === 0) {
      return { columns: [], rows: [] };
    }
    const [first] = results;
    return { columns: first.columns, rows: first.values };
  } catch (err) {
    throw new SqlExecutionError(formatSqliteError((err as Error).message));
  }
}

function formatSqliteError(message: string): string {
  // sql.js surfaces raw sqlite3 error strings; keep them but strip noisy prefixes.
  return message.replace(/^Error:\s*/i, "");
}

/**
 * Compares an executed result set against the expected result for a
 * problem. Order-sensitive: SQL result order is only guaranteed by ORDER BY,
 * so problems that require a specific order must include it in expectedResult.
 */
export function isResultCorrect(
  actual: QueryResultSet,
  expected: QueryResultSet,
): boolean {
  if (actual.columns.length !== expected.columns.length) return false;
  const colsMatch = expected.columns.every(
    (c, i) => c.toLowerCase() === actual.columns[i]?.toLowerCase(),
  );
  if (!colsMatch) return false;
  if (actual.rows.length !== expected.rows.length) return false;
  return actual.rows.every((row, i) =>
    row.every((cell, j) => normalizeCell(cell) === normalizeCell(expected.rows[i][j])),
  );
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return String(value).trim();
}

export function extractSchemaInfo(
  db: Database,
): { table: string; columns: string[] }[] {
  const result = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  );
  if (result.length === 0) return [];
  const tables = result[0].values.map((r) => String(r[0]));
  return tables.map((table: string) => {
    const info = db.exec(`PRAGMA table_info(${escapeIdentifier(table)})`);
    const columns = info.length
      ? info[0].values.map((r) => String(r[1]))
      : [];
    return { table, columns };
  });
}

function escapeIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
