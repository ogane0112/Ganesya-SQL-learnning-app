import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export default function Register() {
  const { register, registerPasskey, passkeySupported } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      setError(t("register.passwordTooShort"));
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password);
      setRegistered(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("register.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPasskey = async () => {
    setPasskeyMessage(null);
    try {
      await registerPasskey();
      setPasskeyMessage(t("register.passkeySuccess"));
    } catch {
      setPasskeyMessage(t("register.passkeyError"));
    }
  };

  if (registered) {
    return (
      <div className="mx-auto max-w-sm p-6">
        <h1 className="text-xl font-bold">{t("register.completeTitle")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("register.completeHint")}</p>
        {passkeySupported && (
          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-700">{t("register.passkeyPrompt")}</p>
            <button
              onClick={handleAddPasskey}
              className="mt-2 min-h-[44px] w-full rounded-lg border border-blue-400 bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100"
            >
              {t("register.addPasskeyButton")}
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
          {t("register.startLearning")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold">{t("register.title")}</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-slate-700">
            {t("register.emailLabel")}
          </label>
          <input
            id="register-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="register-password" className="block text-sm font-medium text-slate-700">
            {t("register.passwordLabel")}
          </label>
          <input
            id="register-password"
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
          {t("register.submit")}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        {t("register.haveAccount")}{" "}
        <Link to="/login" className="text-blue-600 underline">
          {t("register.loginLink")}
        </Link>
      </p>
    </div>
  );
}
