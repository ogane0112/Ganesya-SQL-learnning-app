import type { Env } from "../types";

const WINDOW_SECONDS = 60;
const MAX_ATTEMPTS = 10;

/**
 * Simple fixed-window rate limiter backed by Cloudflare KV, used as
 * defense-in-depth on auth endpoints alongside Cloudflare's platform-level
 * WAF/Rate Limiting (要件3, 5: セキュリティ区分).
 */
export async function checkRateLimit(
  env: Env,
  key: string,
): Promise<boolean> {
  const kvKey = `ratelimit:${key}`;
  const current = await env.SESSIONS.get(kvKey);
  const count = current ? Number(current) : 0;
  if (count >= MAX_ATTEMPTS) return false;
  await env.SESSIONS.put(kvKey, String(count + 1), {
    expirationTtl: WINDOW_SECONDS,
  });
  return true;
}
