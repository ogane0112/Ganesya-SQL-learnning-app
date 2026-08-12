-- D1 (SQLite) スキーマ定義。要件定義書 7章に対応。

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS passkey_credentials (
  id TEXT PRIMARY KEY,               -- Credential ID (base64url)
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,          -- base64url-encoded COSE public key
  counter INTEGER NOT NULL DEFAULT 0,
  device_name TEXT,
  transports TEXT,                   -- JSON array, e.g. ["internal","hybrid"]
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id
  ON passkey_credentials(user_id);

CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1,
  schema_sql TEXT NOT NULL,
  seed_sql TEXT NOT NULL,
  expected_result TEXT NOT NULL,     -- JSON: { columns: string[], rows: unknown[][] }
  hints TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings（要件9.4）
  explanation TEXT NOT NULL DEFAULT '',
  sample_answer TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'ja', -- 将来の多言語化に備えた列（要件9.5）
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MVPでは problems はフロントエンドの静的データ (src/data/problems.ts) を正として
-- 動作させており、この表は将来 D1 管理へ移行する際の受け皿として用意している
-- （要件9.2: MVPはGitベース管理、将来D1/CMS化を検討）。

CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'correct', 'incorrect')),
  last_submitted_sql TEXT,
  hints_used INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
