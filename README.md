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
- [x] 多言語対応（日本語・英語、UI文言と問題データ双方を翻訳、言語切替UIあり）
- [x] 自動テスト（フロントエンド: Vitest、バックエンド: Vitest + Workers実行環境）
- [ ] 管理画面（要件9.2の通りMVPでは対象外、`docs/requirements.md`参照）

## 多言語対応（i18n）

- UI文言は `react-i18next` で管理し、`frontend/src/i18n/locales/{ja,en}.json` に集約しています。
- 問題データ（`frontend/src/data/problems.ts`）は `content.ja` / `content.en` に
  タイトル・説明・ヒント・解説に加えて、**シード データと期待結果もロケールごとに**保持しています
  （部署名などの文字列リテラルが説明文・模範解答と一致している必要があるため）。
  テーブル定義（`schemaSql`）と難易度はロケール非依存で共有します。
- 初期言語は 「localStorageに保存済みの選択」→「ブラウザの言語」→「日本語」の優先順で決定し、
  ヘッダーの言語切替UIで変更した選択は `localStorage`（`sql-app:locale`）に永続化されます。
- 進捗（`progress`テーブル）は `problemId` で紐づくため、言語を切り替えても同じ問題の
  正誤状況は保持されます（バックエンド側の変更は不要）。
- 新しい言語を追加する場合: (1) `i18n/locales/<lang>.json` を追加、(2) `i18n/index.ts` の
  `SUPPORTED_LOCALES` に追加、(3) `data/problems.ts` の各問題の `content` に該当ロケールを追加、
  の3ステップです。

## テスト

```bash
# フロントエンド（Vitest + Testing Library、sql.jsを使った実DB実行を含む）
cd frontend
npm test

# バックエンド（Vitest + @cloudflare/vitest-pool-workers、実際のD1/KVバインディング上で実行）
cd workers
npm test
```

- フロントエンド: `sqlEngine`（SQL実行・正誤判定）、`guestProgress`（localStorage）、
  各ページ（ログイン/登録/問題一覧/問題演習/言語切替）のコンポーネントテストを含みます。
  CodeMirrorエディタ自体はjsdomの文字計測API非対応のためテスト対象から意図的に外し
  （`ProblemSolve.test.tsx`内でモックに置換）、動作は手動のブラウザ確認で担保しています。
- バックエンド: パスワードハッシュ化・JWT発行検証の単体テストに加え、
  実際のWorkers実行環境・D1・KVバインディング上で `/auth/*` `/progress/*` `/webauthn/*`
  の各エンドポイントを検証する結合テストを含みます。特にゲスト進捗マージ（要件9.6）の
  マージルール（正解優先・新しい方優先）は複数シナリオでカバーしています。
- `docs/requirements.md` 11章のテスト区分（単体／結合）に沿って、上記が最低限のカバレッジです。
  総合テスト（E2Eブラウザ操作）は未整備のため、UI変更時は手動でのブラウザ確認を推奨します。
