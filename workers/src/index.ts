import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { authRoutes } from "./routes/auth";
import { webauthnRoutes } from "./routes/webauthn";
import { progressRoutes } from "./routes/progress";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: (origin, c) => (origin === c.env.RP_ORIGIN ? origin : ""),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (c) => c.json({ ok: true, service: "sql-app-api" }));

app.route("/auth", authRoutes);
app.route("/webauthn", webauthnRoutes);
app.route("/progress", progressRoutes);

export default app;
