import { Hono } from "hono";
import type { Env } from "../types";
import { requireAuth } from "../lib/authMiddleware";

export const progressRoutes = new Hono<{ Bindings: Env }>();
progressRoutes.use("*", requireAuth);

interface ProgressRow {
  problem_id: string;
  status: "not_started" | "correct" | "incorrect";
  last_submitted_sql: string | null;
  updated_at: string;
}

interface ProgressEntry {
  problemId: string;
  status: "not_started" | "correct" | "incorrect";
  lastSubmittedSql: string;
  updatedAt: string;
}

function isValidEntry(e: unknown): e is ProgressEntry {
  if (!e || typeof e !== "object") return false;
  const entry = e as Record<string, unknown>;
  return (
    typeof entry.problemId === "string" &&
    (entry.status === "not_started" ||
      entry.status === "correct" ||
      entry.status === "incorrect") &&
    typeof entry.lastSubmittedSql === "string" &&
    typeof entry.updatedAt === "string"
  );
}

progressRoutes.get("/", async (c) => {
  const user = c.get("user");
  const rows = await c.env.DB.prepare(
    "SELECT problem_id, status, last_submitted_sql, updated_at FROM progress WHERE user_id = ?",
  )
    .bind(user.id)
    .all<ProgressRow>();

  const progress: ProgressEntry[] = (rows.results ?? []).map((r) => ({
    problemId: r.problem_id,
    status: r.status,
    lastSubmittedSql: r.last_submitted_sql ?? "",
    updatedAt: r.updated_at,
  }));
  return c.json({ progress });
});

progressRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  if (!isValidEntry(body)) {
    return c.json({ error: "リクエストが不正です。" }, 400);
  }
  await upsertProgress(c.env, user.id, body);
  return c.json({ ok: true });
});

/**
 * ゲスト（未ログイン）時に localStorage へ保存していた進捗を、ログイン/新規登録
 * 成功時に一度だけ D1 へ統合するマイグレーションAPI（要件9.6）。
 *
 * マージ方針:
 *  1. D1に記録が無ければゲスト進捗を新規登録
 *  2. D1に既存記録がある場合、どちらかが正解済みなら正解扱いを優先
 *  3. ステータスが同着（両方不正解等）の場合は updated_at が新しい方を採用
 */
progressRoutes.post("/migrate", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  const entries = body?.entries;
  if (!Array.isArray(entries) || !entries.every(isValidEntry)) {
    return c.json({ error: "リクエストが不正です。" }, 400);
  }

  for (const guestEntry of entries as ProgressEntry[]) {
    const existing = await c.env.DB.prepare(
      "SELECT status, last_submitted_sql, updated_at FROM progress WHERE user_id = ? AND problem_id = ?",
    )
      .bind(user.id, guestEntry.problemId)
      .first<ProgressRow>();

    if (!existing) {
      await upsertProgress(c.env, user.id, guestEntry);
      continue;
    }

    const merged = mergeProgress(existing, guestEntry);
    await upsertProgress(c.env, user.id, merged);
  }

  return c.json({ ok: true });
});

function mergeProgress(
  existing: ProgressRow,
  guest: ProgressEntry,
): ProgressEntry {
  if (existing.status === "correct" || guest.status === "correct") {
    const useGuestSql =
      guest.status === "correct" && existing.status !== "correct";
    return {
      problemId: guest.problemId,
      status: "correct",
      lastSubmittedSql: useGuestSql
        ? guest.lastSubmittedSql
        : (existing.last_submitted_sql ?? guest.lastSubmittedSql),
      updatedAt:
        new Date(guest.updatedAt) > new Date(existing.updated_at)
          ? guest.updatedAt
          : existing.updated_at,
    };
  }
  // どちらも不正解/未着手の場合は、より新しい updated_at 側を採用
  if (new Date(guest.updatedAt) > new Date(existing.updated_at)) {
    return guest;
  }
  return {
    problemId: guest.problemId,
    status: existing.status,
    lastSubmittedSql: existing.last_submitted_sql ?? "",
    updatedAt: existing.updated_at,
  };
}

async function upsertProgress(
  env: Env,
  userId: string,
  entry: ProgressEntry,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO progress (user_id, problem_id, status, last_submitted_sql, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (user_id, problem_id) DO UPDATE SET
       status = excluded.status,
       last_submitted_sql = excluded.last_submitted_sql,
       updated_at = excluded.updated_at`,
  )
    .bind(
      userId,
      entry.problemId,
      entry.status,
      entry.lastSubmittedSql,
      entry.updatedAt,
    )
    .run();
}
