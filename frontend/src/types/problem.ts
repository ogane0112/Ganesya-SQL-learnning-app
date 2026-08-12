export interface QueryResultSet {
  columns: string[];
  rows: unknown[][];
}

export type Locale = "ja" | "en";

/**
 * Everything about a problem that varies by locale — including seed data and
 * expected results, since the seed data contains locale-appropriate values
 * (e.g. department names) that the description and sample answer refer to
 * by literal string (要件9.5: 問題文・データのlocale別管理).
 */
export interface ProblemLocaleContent {
  title: string;
  description: string;
  category: string;
  hints: string[];
  explanation: string;
  seedSql: string;
  expectedResult: QueryResultSet;
  sampleAnswer: string;
}

export interface Problem {
  id: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Table/column structure only — locale-independent. */
  schemaSql: string;
  content: Record<Locale, ProblemLocaleContent>;
}

export type ProgressStatus = "not_started" | "correct" | "incorrect";

export interface ProgressEntry {
  problemId: string;
  status: ProgressStatus;
  lastSubmittedSql: string;
  updatedAt: string;
  hintsUsed?: number;
}
