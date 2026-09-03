import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { Alert, Button, Card, Field } from "../components/ui";

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
    <AuthShell title={t("login.title")} subtitle={t("login.subtitle")}>
      {passkeySupported && (
        <>
          <Button variant="secondary" className="w-full" onClick={handlePasskeyLogin}>
            {t("login.passkeyButton")}
          </Button>
          <Divider label={t("login.or")} />
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          id="login-email"
          label={t("login.emailLabel")}
          type="email"
          required
          autoComplete="username webauthn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          id="login-password"
          label={t("login.passwordLabel")}
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" disabled={submitting} className="w-full">
          {t("login.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {t("login.noAccount")}{" "}
        <Link to="/register" className="focus-ring rounded font-medium text-blue-600 hover:underline">
          {t("login.registerLink")}
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link to="/problems" className="focus-ring rounded text-slate-500 hover:text-slate-700 hover:underline">
          {t("login.continueWithoutLogin")}
        </Link>
      </p>
    </AuthShell>
  );
}

/** Shared frame for login / register so the two screens are visibly siblings. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
      </div>
      <Card className="p-6 sm:p-8">
        <div className="space-y-4">{children}</div>
      </Card>
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      {label}
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
