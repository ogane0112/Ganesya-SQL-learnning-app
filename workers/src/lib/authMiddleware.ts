import type { MiddlewareHandler } from "hono";
import { verifyJwt } from "./jwt";
import type { Env, AuthUser } from "../types";

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

/** Requires a valid Bearer JWT; rejects with 401 otherwise. */
export const requireAuth: MiddlewareHandler<{ Bindings: Env }> = async (
  c,
  next,
) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return c.json({ error: "認証が必要です。" }, 401);
  }
  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: "セッションが無効です。再度ログインしてください。" }, 401);
  }
  c.set("user", { id: payload.sub, email: payload.email });
  await next();
};
