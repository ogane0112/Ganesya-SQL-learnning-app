import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button, ButtonLink } from "./ui";

/**
 * App frame. The header is deliberately quiet — a single brand mark, one nav
 * link with an active state, and account controls — so attention stays on
 * the page content (the problem and the editor).
 */
export function Layout() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="focus-ring flex items-center gap-2 rounded-lg py-1 pr-1 font-semibold text-slate-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-mono text-[11px] font-bold tracking-tight text-white shadow-sm">
              SQL
            </span>
            <span className="hidden sm:inline">{t("app.name")}</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm" aria-label="main">
            <NavLink
              to="/problems"
              className={({ isActive }) =>
                `focus-ring min-h-[44px] rounded-lg px-3 py-2 font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {t("nav.problems")}
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            {!loading &&
              (user ? (
                <>
                  <span className="hidden max-w-[18ch] truncate text-sm text-slate-500 md:inline">
                    {user.email}
                  </span>
                  <Button variant="ghost" onClick={logout}>
                    {t("nav.logout")}
                  </Button>
                </>
              ) : (
                <ButtonLink to="/login" variant="secondary">
                  {t("nav.login")}
                </ButtonLink>
              ))}
          </div>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
