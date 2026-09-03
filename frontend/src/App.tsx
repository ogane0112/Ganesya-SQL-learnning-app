import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import ProblemList from "./pages/ProblemList";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Monaco is a heavy dependency and only the solve page needs it — split it off
// so the rest of the app loads without paying for the editor.
const ProblemSolve = lazy(() => import("./pages/ProblemSolve"));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="problems" element={<ProblemList />} />
            <Route
              path="problems/:id"
              element={
                <Suspense fallback={<div className="p-6 text-slate-500">…</div>}>
                  <ProblemSolve />
                </Suspense>
              }
            />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
