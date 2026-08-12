import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export default function Register() {
  const { register, registerPasskey, passkeySupported } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password);
      setRegistered(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "登録に失敗しました。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPasskey = async () => {
    setPasskeyMessage(null);
    try {
      await registerPasskey();
      setPasskeyMessage("パスキーを登録しました。");
    } catch {
      setPasskeyMessage(
        "パスキーの登録に失敗またはキャンセルされました。後で設定から再度登録できます。",
      );
    }
  };

  if (registered) {
    return (
      <div className="mx-auto max-w-sm p-6">
        <h1 className="text-xl font-bold">登録が完了しました</h1>
        <p className="mt-2 text-sm text-slate-600">
          次回以降はID・パスワードでログインできます。
        </p>
        {passkeySupported && (
          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-700">
              このデバイスではパスキー（生体認証等）でのログインも利用できます。
            </p>
            <button
              onClick={handleAddPasskey}
              className="mt-2 min-h-[44px] w-full rounded-lg border border-blue-400 bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100"
            >
              🔐 パスキーを追加登録する
            </button>
            {passkeyMessage && (
              <p className="mt-2 text-sm text-slate-600">{passkeyMessage}</p>
            )}
          </div>
        )}
        <button
          onClick={() => navigate("/problems")}
          className="mt-4 min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white"
        >
          学習をはじめる
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold">新規登録</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            メールアドレス
          </label>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            パスワード（8文字以上）
          </label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          登録する
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        すでにアカウントをお持ちの方は{" "}
        <Link to="/login" className="text-blue-600 underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
