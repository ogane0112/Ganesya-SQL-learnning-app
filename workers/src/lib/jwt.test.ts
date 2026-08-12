import { describe, it, expect, vi } from "vitest";
import { signJwt, verifyJwt } from "./jwt";

const SECRET = "test-secret";

describe("jwt", () => {
  it("round-trips a signed token", async () => {
    const token = await signJwt({ sub: "user-1", email: "a@example.com" }, SECRET);
    const payload = await verifyJwt(token, SECRET);
    expect(payload).toMatchObject({ sub: "user-1", email: "a@example.com" });
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signJwt({ sub: "user-1", email: "a@example.com" }, SECRET);
    expect(await verifyJwt(token, "other-secret")).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await signJwt({ sub: "user-1", email: "a@example.com" }, SECRET);
    const [header, , signature] = token.split(".");
    const tamperedPayload = btoa(
      JSON.stringify({ sub: "attacker", email: "a@example.com" }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verifyJwt(`${header}.${tamperedPayload}.${signature}`, SECRET)).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    expect(await verifyJwt("not-a-jwt", SECRET)).toBeNull();
    expect(await verifyJwt("a.b", SECRET)).toBeNull();
  });

  it("rejects an expired token (要件F-14)", async () => {
    vi.useFakeTimers();
    const token = await signJwt({ sub: "user-1", email: "a@example.com" }, SECRET);
    vi.advanceTimersByTime(1000 * 60 * 60 * 24 * 8); // 8 days later
    expect(await verifyJwt(token, SECRET)).toBeNull();
    vi.useRealTimers();
  });
});
