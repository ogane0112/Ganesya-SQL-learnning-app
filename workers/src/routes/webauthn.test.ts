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

async function registerAndGetToken(email: string): Promise<string> {
  const res = await call("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  const { token } = await res.json<{ token: string }>();
  return token;
}

describe("webauthn routes", () => {
  it("rejects /register/options without auth (要件6.2: ログイン済みユーザーのみ登録可)", async () => {
    const res = await call("/webauthn/register/options", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("generates registration options scoped to the RP for a logged-in user", async () => {
    const token = await registerAndGetToken("webauthn-reg@example.com");
    const res = await call("/webauthn/register/options", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const options = await res.json<{
      rp: { id: string; name: string };
      challenge: string;
      user: { name: string };
    }>();
    expect(options.rp.id).toBe(env.RP_ID);
    expect(options.user.name).toBe("webauthn-reg@example.com");
    expect(options.challenge).toBeTruthy();
  });

  it("rejects register/verify with no prior challenge issued", async () => {
    const token = await registerAndGetToken("webauthn-noverify@example.com");
    const res = await call("/webauthn/register/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ credential: { id: "fake" } }),
    });
    expect(res.status).toBe(400);
  });

  it("generates login options without requiring auth (usernameless-capable)", async () => {
    const res = await call("/webauthn/login/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const options = await res.json<{ challengeId: string; challenge: string }>();
    expect(options.challengeId).toBeTruthy();
    expect(options.challenge).toBeTruthy();
  });

  it("rejects login/verify with an unknown or expired challengeId", async () => {
    const res = await call("/webauthn/login/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential: { id: "does-not-exist" },
        challengeId: "nonexistent-challenge-id",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects login/verify for a credential that was never registered", async () => {
    const optionsRes = await call("/webauthn/login/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const { challengeId } = await optionsRes.json<{ challengeId: string }>();

    const res = await call("/webauthn/login/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential: { id: "unregistered-credential-id" },
        challengeId,
      }),
    });
    expect(res.status).toBe(401);
  });
});
