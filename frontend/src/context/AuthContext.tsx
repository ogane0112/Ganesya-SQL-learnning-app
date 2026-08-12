import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";
import { api, clearToken, getToken, setToken } from "../lib/api";
import { clearGuestProgress, getGuestProgress } from "../lib/guestProgress";

interface User {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  passkeySupported: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  registerPasskey: () => Promise<void>;
  loginWithPasskey: (email?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Migrates any guest (localStorage) progress into D1, then clears it. 要件 9.6 */
async function migrateGuestProgressIfAny() {
  const guest = getGuestProgress();
  if (guest.length === 0) return;
  try {
    await api.migrateGuestProgress(guest);
    clearGuestProgress();
  } catch {
    // Non-fatal: keep guest progress locally so it isn't lost, retry next login.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const passkeySupported =
    typeof window !== "undefined" && browserSupportsWebAuthn();

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const { user } = await api.me();
          setUser(user);
        } catch {
          clearToken();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    setToken(token);
    setUser(user);
    await migrateGuestProgressIfAny();
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.register(email, password);
    setToken(token);
    setUser(user);
    await migrateGuestProgressIfAny();
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const registerPasskey = useCallback(async () => {
    const options = await api.passkeyRegisterOptions();
    const credential = await startRegistration({
      optionsJSON: options as never,
    });
    await api.passkeyRegisterVerify(credential);
  }, []);

  const loginWithPasskey = useCallback(async (email?: string) => {
    const { challengeId, ...options } = await api.passkeyLoginOptions(email);
    const credential = await startAuthentication({
      optionsJSON: options as never,
    });
    const { token, user } = await api.passkeyLoginVerify(
      credential,
      challengeId as string,
    );
    setToken(token);
    setUser(user);
    await migrateGuestProgressIfAny();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        passkeySupported,
        login,
        register,
        logout,
        registerPasskey,
        loginWithPasskey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
