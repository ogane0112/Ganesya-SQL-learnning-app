import schemaSql from "../../db/schema.sql?raw";

/**
 * Applies db/schema.sql to a test D1 instance. Test files run inside the
 * actual Workers runtime (workerd), which has no real filesystem access, so
 * the schema is inlined at bundle time via `?raw` rather than read with
 * node:fs. D1Database#exec() also splits on newlines rather than statement
 * terminators, which our multi-line CREATE TABLE statements don't survive —
 * so instead we split on `;` ourselves and run each statement individually,
 * same as a real migration.
 */
export async function applySchema(db: D1Database): Promise<void> {
  const statements = schemaSql
    .split("\n")
    .filter((line: string) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s: string) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}
