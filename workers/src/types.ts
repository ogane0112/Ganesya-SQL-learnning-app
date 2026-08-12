export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  // WebAuthn Relying Party config — must match the deployed frontend origin.
  RP_ID: string;
  RP_NAME: string;
  RP_ORIGIN: string;
}

export interface AuthUser {
  id: string;
  email: string;
}
