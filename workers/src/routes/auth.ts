import { Hono } from "hono";
import type { Env } from "../types";
import { hashPassword, verifyPassword } from "../lib/password";
import { signJwt } from "../lib/jwt";
import { requireAuth } from "../lib/authMiddleware";
import { checkRateLimit } from "../lib/rateLimit";

export const authRoutes = new Hono<{ Bindings: Env }>();

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
}

function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

authRoutes.post("/register", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!(await checkRateLimit(c.env, `register:${ip}`))) {
    return c.json({ error: "しばらく時間をおいて再度お試しください。" }, 429);
  }

  const body = await c.req.json().catch(() => null);
  const email = body?.email;
  const password = body?.password;
  if (!isValidEmail(email) || typeof password !== "string" || password.length < 8) {
    return c.json(
      { error: "メールアドレスと8文字以上のパスワードを入力してください。" },
      400,
    );
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM users WHERE email = ?",
  )
    .bind(email)
    .first();
  if (existing) {
    return c.json({ error: "このメールアドレスは既に登録されています。" }, 409);
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await c.env.DB.prepare(
    "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
  )
    .bind(id, email, passwordHash)
    .run();

  const token = await signJwt({ sub: id, email }, c.env.JWT_SECRET);
  return c.json({ token, user: { id, email } }, 201);
});

authRoutes.post("/login", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const body = await c.req.json().catch(() => null);
  const email = body?.email;
  const password = body?.password;
  if (!isValidEmail(email) || typeof password !== "string") {
    return c.json({ error: "メールアドレスとパスワードを入力してください。" }, 400);
  }
  if (!(await checkRateLimit(c.env, `login:${ip}:${email}`))) {
    return c.json({ error: "しばらく時間をおいて再度お試しください。" }, 429);
  }

  const user = await c.env.DB.prepare(
    "SELECT id, email, password_hash FROM users WHERE email = ?",
  )
    .bind(email)
    .first<UserRow>();

  if (!user || !user.password_hash) {
    return c.json({ error: "メールアドレスまたはパスワードが違います。" }, 401);
  }
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return c.json({ error: "メールアドレスまたはパスワードが違います。" }, 401);
  }

  const token = await signJwt({ sub: user.id, email: user.email }, c.env.JWT_SECRET);
  return c.json({ token, user: { id: user.id, email: user.email } });
});

authRoutes.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  return c.json({ user });
});
