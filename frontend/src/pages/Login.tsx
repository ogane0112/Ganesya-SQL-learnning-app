import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

/**
 * ID+パスワードを常時の主導線とし、パスキーは対応ブラウザにのみ
 * 追加の選択肢として表示する（要件 9.1）。
 */
export default function Login() {
  const { login, loginWithPasskey, passkeySupported } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/problems");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("login.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setError(null);
    try {
      await loginWithPasskey(email || undefined);
      navigate("/problems");
    } catch {
      // 途中失敗時は自動的にID+パスワード入力フォームへフォールバック（既に表示中のため何もしない）
      setError(t("login.passkeyError"));
    }
  };

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold">{t("login.title")}</h1>

      {passkeySupported && (
        <button
          onClick={handlePasskeyLogin}
          className="mt-4 min-h-[44px] w-full rounded-lg border border-blue-400 bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100"
        >
          {t("login.passkeyButton")}
        </button>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
            {t("login.emailLabel")}
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="username webauthn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
            {t("login.passwordLabel")}
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
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
          {t("login.submit")}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        {t("login.noAccount")}{" "}
        <Link to="/register" className="text-blue-600 underline">
          {t("login.registerLink")}
        </Link>
      </p>
      <p className="mt-2 text-sm">
        <Link to="/problems" className="text-slate-500 underline">
          {t("login.continueWithoutLogin")}
        </Link>
      </p>
    </div>
  );
}
