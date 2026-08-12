# SQL学習アプリ

ブラウザ上でSQLを書いて、その場で実行しながら学べる学習アプリです。
入力したSQLは**ブラウザ内のSQLite(WASM)**で実行され、サーバーには送信されません。

詳細な要件は [`docs/requirements.md`](./docs/requirements.md) を参照してください。

## 構成

```
frontend/   React + Vite製SPA。CodeMirror 6 SQLエディタ + sql.js（クライアントサイドSQLite実行）
workers/    Cloudflare Workers製API。認証（ID/PW・パスキー）、学習進捗の保存
```

- ホスティング: Cloudflare Pages（frontend）
- API: Cloudflare Workers（workers）
- DB: Cloudflare D1（ユーザー・パスキー・進捗）
- KV: Cloudflare KV（WebAuthnチャレンジ・簡易レート制限）

## セットアップ

### フロントエンド

```bash
cd frontend
npm install
cp .env.example .env   # 必要に応じて VITE_API_BASE_URL を設定
npm run dev            # http://localhost:5173
```

`vite.config.ts` のプロキシ設定により、`/api/*` へのリクエストはローカルの
Workers（`http://localhost:8787`）へ転送されます。

### バックエンド（Workers）

```bash
cd workers
npm install
cp .dev.vars.example .dev.vars   # JWT_SECRET をローカル開発用に設定

# ローカルD1にスキーマを反映
npm run db:migrate:local

npm run dev             # http://localhost:8787 (wrangler dev)
```

初回はローカルD1データベースを作成してください:

```bash
npx wrangler d1 create sql-app-db
# 出力される database_id を wrangler.toml の [[d1_databases]] に設定
npx wrangler kv namespace create SESSIONS
# 出力される id を wrangler.toml の [[kv_namespaces]] に設定
```

両方を起動した状態でフロントエンド (`npm run dev`) にアクセスすると、
新規登録・ログイン・パスキー登録・進捗保存が一通り動作します。

## デプロイ

```bash
# Workers
cd workers
npx wrangler secret put JWT_SECRET --env production
npm run db:migrate:remote
npx wrangler deploy --env production

# Pages（frontend）
cd frontend
npm run build
npx wrangler pages deploy dist --project-name sql-app
```

本番デプロイ時は `wrangler.toml` の `RP_ID` / `RP_ORIGIN`（WebAuthn用）と
`frontend/.env` の `VITE_API_BASE_URL` を実際のドメインに合わせて更新してください。
パスキーはHTTPSかつ`RP_ORIGIN`と実際のオリジンが一致していないと動作しません。

## 実装状況（MVP）

- [x] クライアントサイドSQL実行（sql.js） / SQLエディタ（CodeMirror 6） / 正誤判定
- [x] 問題10問（SELECT / WHERE / ORDER BY / 集計 / GROUP BY / JOIN / LEFT JOIN / INSERT / UPDATE）
- [x] 段階的ヒント・解説表示
- [x] ID/パスワード認証、パスキー（WebAuthn）登録・ログイン
- [x] ログイン状態に応じた進捗保存（D1）／ゲスト進捗（localStorage）とログイン時マイグレーション
- [x] レスポンシブ対応（モバイルはタブ切替UI + SQL入力支援ツールバー）
- [ ] 管理画面（要件9.2の通りMVPでは対象外、`docs/requirements.md`参照）
- [ ] 多言語対応（i18n基盤のみ導入、翻訳は日本語のみ）

## テスト

現時点では自動テストは未整備です。`docs/requirements.md` 11章の開発プロセスに従い、
今後 `docs/test-spec.md`（単体・結合テスト仕様書）を作成の上でテストを追加してください。
