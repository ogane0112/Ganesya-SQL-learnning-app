import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Layout() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <Link to="/" className="font-bold text-slate-800">
          {t("app.name")}
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/problems" className="text-slate-600 hover:text-slate-900">
            {t("nav.problems")}
          </Link>
          <LanguageSwitcher />
          {!loading && (
            user ? (
              <>
                <span className="hidden text-slate-500 sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className="min-h-[44px] rounded px-3 text-slate-600 hover:bg-slate-100"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="min-h-[44px] rounded px-3 py-2 text-blue-600 hover:bg-blue-50"
              >
                {t("nav.login")}
              </Link>
            )
          )}
        </nav>
      </header>
      <main className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
