import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { Alert, Button, Field, Icon } from "../components/ui";
import { AuthShell } from "./Login";

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
      <AuthShell title={t("register.completeTitle")} subtitle={t("register.completeHint")}>
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Icon name="check" size={28} />
          </span>
        </div>
        {passkeySupported && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">{t("register.passkeyPrompt")}</p>
            <Button variant="secondary" className="mt-3 w-full" onClick={handleAddPasskey}>
              {t("register.addPasskeyButton")}
            </Button>
            {passkeyMessage && (
              <p className="mt-2 text-sm text-slate-600">{passkeyMessage}</p>
            )}
          </div>
        )}
        <Button className="w-full" onClick={() => navigate("/problems")}>
          {t("register.startLearning")}
          <Icon name="play" size={16} />
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("register.title")} subtitle={t("register.subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          id="register-email"
          label={t("register.emailLabel")}
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          id="register-password"
          label={t("register.passwordLabel")}
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" disabled={submitting} className="w-full">
          {t("register.submit")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {t("register.haveAccount")}{" "}
        <Link to="/login" className="focus-ring rounded font-medium text-blue-600 hover:underline">
          {t("register.loginLink")}
        </Link>
      </p>
    </AuthShell>
  );
}
