import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <Link to="/" className="font-bold text-slate-800">
          SQL学習アプリ
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/problems" className="text-slate-600 hover:text-slate-900">
            問題一覧
          </Link>
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
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="min-h-[44px] rounded px-3 py-2 text-blue-600 hover:bg-blue-50"
              >
                ログイン
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
