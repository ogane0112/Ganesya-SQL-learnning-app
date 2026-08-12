export interface QueryResultSet {
  columns: string[];
  rows: unknown[][];
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  schemaSql: string;
  seedSql: string;
  expectedResult: QueryResultSet;
  hints: string[];
  explanation: string;
  sampleAnswer: string;
}

export type ProgressStatus = "not_started" | "correct" | "incorrect";

export interface ProgressEntry {
  problemId: string;
  status: ProgressStatus;
  lastSubmittedSql: string;
  updatedAt: string;
  hintsUsed?: number;
}
