import { Hono } from "hono";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type { Env } from "../types";
import { requireAuth } from "../lib/authMiddleware";
import { signJwt } from "../lib/jwt";

export const webauthnRoutes = new Hono<{ Bindings: Env }>();

const CHALLENGE_TTL_SECONDS = 300;

interface CredentialRow {
  id: string;
  user_id: string;
  public_key: string;
  counter: number;
  transports: string | null;
}

interface UserRow {
  id: string;
  email: string;
}

// --- Registration (要件6.2, F-11, F-15): ログイン済みユーザーがパスキーを追加登録 ---

webauthnRoutes.post("/register/options", requireAuth, async (c) => {
  const user = c.get("user");
  const existing = await c.env.DB.prepare(
    "SELECT id, transports FROM passkey_credentials WHERE user_id = ?",
  )
    .bind(user.id)
    .all<{ id: string; transports: string | null }>();

  const options = await generateRegistrationOptions({
    rpName: c.env.RP_NAME,
    rpID: c.env.RP_ID,
    userName: user.email,
    userID: new TextEncoder().encode(user.id) as Uint8Array<ArrayBuffer>,
    attestationType: "none",
    excludeCredentials: (existing.results ?? []).map((r) => ({
      id: r.id,
      transports: r.transports
        ? (JSON.parse(r.transports) as AuthenticatorTransportFuture[])
        : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  await c.env.SESSIONS.put(`webauthn:reg:${user.id}`, options.challenge, {
    expirationTtl: CHALLENGE_TTL_SECONDS,
  });

  return c.json(options);
});

webauthnRoutes.post("/register/verify", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  const credential = body?.credential as RegistrationResponseJSON | undefined;
  if (!credential) {
    return c.json({ error: "リクエストが不正です。" }, 400);
  }

  const expectedChallenge = await c.env.SESSIONS.get(
    `webauthn:reg:${user.id}`,
  );
  if (!expectedChallenge) {
    return c.json(
      { error: "登録セッションの有効期限が切れました。もう一度お試しください。" },
      400,
    );
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: c.env.RP_ORIGIN,
      expectedRPID: c.env.RP_ID,
    });
  } catch {
    return c.json({ error: "パスキーの検証に失敗しました。" }, 400);
  }

  await c.env.SESSIONS.delete(`webauthn:reg:${user.id}`);

  if (!verification.verified) {
    return c.json({ error: "パスキーの検証に失敗しました。" }, 400);
  }

  const { credential: verified } = verification.registrationInfo;
  await c.env.DB.prepare(
    `INSERT INTO passkey_credentials (id, user_id, public_key, counter, device_name, transports)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      verified.id,
      user.id,
      isoBase64URL.fromBuffer(verified.publicKey),
      verified.counter,
      c.req.header("User-Agent")?.slice(0, 100) ?? null,
      verified.transports ? JSON.stringify(verified.transports) : null,
    )
    .run();

  return c.json({ verified: true });
});

// --- Authentication (要件6.3, F-12): パスキーログイン ---

webauthnRoutes.post("/login/options", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email : undefined;

  let allowCredentials:
    | { id: string; transports?: AuthenticatorTransportFuture[] }[]
    | undefined;

  if (email) {
    const user = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?",
    )
      .bind(email)
      .first<{ id: string }>();
    if (user) {
      const creds = await c.env.DB.prepare(
        "SELECT id, transports FROM passkey_credentials WHERE user_id = ?",
      )
        .bind(user.id)
        .all<{ id: string; transports: string | null }>();
      allowCredentials = (creds.results ?? []).map((r) => ({
        id: r.id,
        transports: r.transports
          ? (JSON.parse(r.transports) as AuthenticatorTransportFuture[])
          : undefined,
      }));
    }
  }
  // email未指定の場合、allowCredentialsを省略しdiscoverable credential（パスキー選択UI）に委ねる

  const options = await generateAuthenticationOptions({
    rpID: c.env.RP_ID,
    allowCredentials,
    userVerification: "preferred",
  });

  const challengeId = crypto.randomUUID();
  await c.env.SESSIONS.put(
    `webauthn:authn:${challengeId}`,
    options.challenge,
    { expirationTtl: CHALLENGE_TTL_SECONDS },
  );

  return c.json({ ...options, challengeId });
});

webauthnRoutes.post("/login/verify", async (c) => {
  const body = await c.req.json().catch(() => null);
  const credential = body?.credential as AuthenticationResponseJSON | undefined;
  const challengeId = body?.challengeId as string | undefined;

  if (!credential || !challengeId) {
    return c.json({ error: "リクエストが不正です。" }, 400);
  }

  const expectedChallenge = await c.env.SESSIONS.get(
    `webauthn:authn:${challengeId}`,
  );
  if (!expectedChallenge) {
    return c.json(
      { error: "認証セッションの有効期限が切れました。もう一度お試しください。" },
      400,
    );
  }
  await c.env.SESSIONS.delete(`webauthn:authn:${challengeId}`);

  const credentialRow = await c.env.DB.prepare(
    "SELECT id, user_id, public_key, counter, transports FROM passkey_credentials WHERE id = ?",
  )
    .bind(credential.id)
    .first<CredentialRow>();

  if (!credentialRow) {
    return c.json({ error: "登録されていないパスキーです。" }, 401);
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: c.env.RP_ORIGIN,
      expectedRPID: c.env.RP_ID,
      credential: {
        id: credentialRow.id,
        publicKey: isoBase64URL.toBuffer(credentialRow.public_key),
        counter: credentialRow.counter,
        transports: credentialRow.transports
          ? (JSON.parse(credentialRow.transports) as AuthenticatorTransportFuture[])
          : undefined,
      },
    });
  } catch {
    return c.json({ error: "パスキー認証に失敗しました。" }, 401);
  }

  if (!verification.verified) {
    return c.json({ error: "パスキー認証に失敗しました。" }, 401);
  }

  // リプレイ攻撃防止カウンタを更新
  await c.env.DB.prepare(
    "UPDATE passkey_credentials SET counter = ? WHERE id = ?",
  )
    .bind(verification.authenticationInfo.newCounter, credentialRow.id)
    .run();

  const user = await c.env.DB.prepare(
    "SELECT id, email FROM users WHERE id = ?",
  )
    .bind(credentialRow.user_id)
    .first<UserRow>();
  if (!user) {
    return c.json({ error: "ユーザーが見つかりません。" }, 404);
  }

  const token = await signJwt({ sub: user.id, email: user.email }, c.env.JWT_SECRET);
  return c.json({ token, user: { id: user.id, email: user.email } });
});
