import { describe, it, expect, beforeAll } from "vitest";
import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import worker from "../index";
import { applySchema } from "../test/applySchema";

beforeAll(async () => {
  await applySchema(env.DB);
});

async function call(path: string, init?: RequestInit) {
  const request = new Request(`http://localhost${path}`, init);
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

function authedJson(token: string, body?: unknown): RequestInit {
  return {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
}

async function registerAndGetToken(email: string): Promise<string> {
  const res = await call("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  const { token } = await res.json<{ token: string }>();
  return token;
}

describe("progress routes", () => {
  it("rejects unauthenticated requests", async () => {
    expect((await call("/progress")).status).toBe(401);
    expect(
      (
        await call("/progress", {
          method: "POST",
          body: JSON.stringify({}),
        })
      ).status,
    ).toBe(401);
  });

  it("returns an empty list for a new user", async () => {
    const token = await registerAndGetToken("progress-empty@example.com");
    const res = await call("/progress", authedJson(token));
    expect(await res.json()).toEqual({ progress: [] });
  });

  it("saves and retrieves progress for a single problem", async () => {
    const token = await registerAndGetToken("progress-save@example.com");
    const entry = {
      problemId: "p001",
      status: "correct",
      lastSubmittedSql: "SELECT * FROM employees;",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const postRes = await call("/progress", authedJson(token, entry));
    expect(postRes.status).toBe(200);

    const getRes = await call("/progress", authedJson(token));
    const { progress } = await getRes.json<{ progress: unknown[] }>();
    expect(progress).toEqual([entry]);
  });

  it("upserts on repeated submissions for the same problem", async () => {
    const token = await registerAndGetToken("progress-upsert@example.com");
    await call(
      "/progress",
      authedJson(token, {
        problemId: "p001",
        status: "incorrect",
        lastSubmittedSql: "SELECT 1;",
        updatedAt: "2026-01-01T00:00:00Z",
      }),
    );
    await call(
      "/progress",
      authedJson(token, {
        problemId: "p001",
        status: "correct",
        lastSubmittedSql: "SELECT * FROM employees;",
        updatedAt: "2026-01-02T00:00:00Z",
      }),
    );
    const { progress } = await (
      await call("/progress", authedJson(token))
    ).json<{ progress: { status: string }[] }>();
    expect(progress).toHaveLength(1);
    expect(progress[0].status).toBe("correct");
  });

  it("rejects a malformed progress entry", async () => {
    const token = await registerAndGetToken("progress-invalid@example.com");
    const res = await call(
      "/progress",
      authedJson(token, { problemId: "p001", status: "totally-wrong" }),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /progress/migrate (要件9.6 ゲスト進捗マージ)", () => {
  it("inserts guest entries with no existing D1 record", async () => {
    const token = await registerAndGetToken("migrate-new@example.com");
    const res = await call(
      "/progress/migrate",
      authedJson(token, {
        entries: [
          {
            problemId: "p001",
            status: "correct",
            lastSubmittedSql: "SELECT 1;",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const { progress } = await (
      await call("/progress", authedJson(token))
    ).json<{ progress: { problemId: string; status: string }[] }>();
    expect(progress).toEqual([
      expect.objectContaining({ problemId: "p001", status: "correct" }),
    ]);
  });

  it("prefers 'correct' when either side already solved it", async () => {
    const token = await registerAndGetToken("migrate-prefer-correct@example.com");
    // Existing D1 record: correct
    await call(
      "/progress",
      authedJson(token, {
        problemId: "p001",
        status: "correct",
        lastSubmittedSql: "SELECT good;",
        updatedAt: "2026-01-01T00:00:00Z",
      }),
    );
    // Guest record: incorrect, but newer
    await call(
      "/progress/migrate",
      authedJson(token, {
        entries: [
          {
            problemId: "p001",
            status: "incorrect",
            lastSubmittedSql: "SELECT bad;",
            updatedAt: "2026-01-05T00:00:00Z",
          },
        ],
      }),
    );
    const { progress } = await (
      await call("/progress", authedJson(token))
    ).json<{ progress: { status: string }[] }>();
    expect(progress[0].status).toBe("correct");
  });

  it("keeps the newer submission when neither side is correct", async () => {
    const token = await registerAndGetToken("migrate-newer-wins@example.com");
    await call(
      "/progress",
      authedJson(token, {
        problemId: "p001",
        status: "incorrect",
        lastSubmittedSql: "SELECT old;",
        updatedAt: "2026-01-01T00:00:00Z",
      }),
    );
    await call(
      "/progress/migrate",
      authedJson(token, {
        entries: [
          {
            problemId: "p001",
            status: "incorrect",
            lastSubmittedSql: "SELECT new;",
            updatedAt: "2026-01-05T00:00:00Z",
          },
        ],
      }),
    );
    const { progress } = await (
      await call("/progress", authedJson(token))
    ).json<{ progress: { lastSubmittedSql: string }[] }>();
    expect(progress[0].lastSubmittedSql).toBe("SELECT new;");
  });

  it("keeps the existing record when the guest submission is older and not correct", async () => {
    const token = await registerAndGetToken("migrate-older-loses@example.com");
    await call(
      "/progress",
      authedJson(token, {
        problemId: "p001",
        status: "incorrect",
        lastSubmittedSql: "SELECT existing;",
        updatedAt: "2026-01-10T00:00:00Z",
      }),
    );
    await call(
      "/progress/migrate",
      authedJson(token, {
        entries: [
          {
            problemId: "p001",
            status: "incorrect",
            lastSubmittedSql: "SELECT older-guest;",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ],
      }),
    );
    const { progress } = await (
      await call("/progress", authedJson(token))
    ).json<{ progress: { lastSubmittedSql: string }[] }>();
    expect(progress[0].lastSubmittedSql).toBe("SELECT existing;");
  });

  it("merges multiple entries independently by problemId", async () => {
    const token = await registerAndGetToken("migrate-multi@example.com");
    const res = await call(
      "/progress/migrate",
      authedJson(token, {
        entries: [
          {
            problemId: "p001",
            status: "correct",
            lastSubmittedSql: "SELECT 1;",
            updatedAt: "2026-01-01T00:00:00Z",
          },
          {
            problemId: "p002",
            status: "incorrect",
            lastSubmittedSql: "SELECT 2;",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const { progress } = await (
      await call("/progress", authedJson(token))
    ).json<{ progress: unknown[] }>();
    expect(progress).toHaveLength(2);
  });
});
