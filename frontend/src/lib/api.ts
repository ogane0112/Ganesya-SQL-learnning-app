const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

const TOKEN_KEY = "sql-app:token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? "リクエストに失敗しました", res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string };
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: { id: string; email: string } }>("/auth/me"),

  passkeyRegisterOptions: () =>
    request<Record<string, unknown>>("/webauthn/register/options", {
      method: "POST",
    }),

  passkeyRegisterVerify: (credential: unknown) =>
    request<{ verified: boolean }>("/webauthn/register/verify", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),

  passkeyLoginOptions: (email?: string) =>
    request<Record<string, unknown>>("/webauthn/login/options", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  passkeyLoginVerify: (credential: unknown, challengeId: string) =>
    request<AuthResponse>("/webauthn/login/verify", {
      method: "POST",
      body: JSON.stringify({ credential, challengeId }),
    }),

  getProgress: () =>
    request<{ progress: import("../types/problem").ProgressEntry[] }>(
      "/progress",
    ),

  saveProgress: (entry: import("../types/problem").ProgressEntry) =>
    request<{ ok: true }>("/progress", {
      method: "POST",
      body: JSON.stringify(entry),
    }),

  migrateGuestProgress: (
    entries: import("../types/problem").ProgressEntry[],
  ) =>
    request<{ ok: true }>("/progress/migrate", {
      method: "POST",
      body: JSON.stringify({ entries }),
    }),
};
