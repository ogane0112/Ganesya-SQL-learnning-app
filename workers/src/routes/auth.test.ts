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

function json(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

describe("POST /auth/register", () => {
  it("registers a new user and returns a JWT", async () => {
    const res = await call(
      "/auth/register",
      json({ email: "new-user@example.com", password: "password123" }),
    );
    expect(res.status).toBe(201);
    const body = await res.json<{ token: string; user: { email: string } }>();
    expect(body.user.email).toBe("new-user@example.com");
    expect(body.token.split(".")).toHaveLength(3);
  });

  it("rejects a duplicate email (要件7 users.email UNIQUE)", async () => {
    await call(
      "/auth/register",
      json({ email: "dup@example.com", password: "password123" }),
    );
    const res = await call(
      "/auth/register",
      json({ email: "dup@example.com", password: "password123" }),
    );
    expect(res.status).toBe(409);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await call(
      "/auth/register",
      json({ email: "short@example.com", password: "short" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects an invalid email format", async () => {
    const res = await call(
      "/auth/register",
      json({ email: "not-an-email", password: "password123" }),
    );
    expect(res.status).toBe(400);
  });

  it("never returns the password or its hash in the response", async () => {
    const res = await call(
      "/auth/register",
      json({ email: "safe@example.com", password: "password123" }),
    );
    const text = await res.text();
    expect(text).not.toContain("password123");
    expect(text).not.toContain("pbkdf2$");
  });
});

describe("POST /auth/login + GET /auth/me", () => {
  it("logs in with correct credentials and fetches the profile with the token", async () => {
    await call(
      "/auth/register",
      json({ email: "login-test@example.com", password: "password123" }),
    );
    const loginRes = await call(
      "/auth/login",
      json({ email: "login-test@example.com", password: "password123" }),
    );
    expect(loginRes.status).toBe(200);
    const { token } = await loginRes.json<{ token: string }>();

    const meRes = await call("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meRes.status).toBe(200);
    const { user } = await meRes.json<{ user: { email: string } }>();
    expect(user.email).toBe("login-test@example.com");
  });

  it("rejects an incorrect password without revealing which field was wrong", async () => {
    await call(
      "/auth/register",
      json({ email: "wrongpw@example.com", password: "password123" }),
    );
    const res = await call(
      "/auth/login",
      json({ email: "wrongpw@example.com", password: "wrong-password" }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects login for a nonexistent user", async () => {
    const res = await call(
      "/auth/login",
      json({ email: "nobody@example.com", password: "password123" }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects /auth/me without a token", async () => {
    const res = await call("/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects /auth/me with a garbage token", async () => {
    const res = await call("/auth/me", {
      headers: { Authorization: "Bearer garbage" },
    });
    expect(res.status).toBe(401);
  });
});
