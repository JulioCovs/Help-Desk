import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppRole } from "./roles";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: AppRole;
  departmentId: number | null;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (input: { email: string; password: string; assertedRole: AppRole }) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: AppRole;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return typeof data.error === "string" ? data.error : res.statusText;
  } catch {
    return res.statusText;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) {
      setUser(null);
      return;
    }
    const data = (await res.json()) as { user: AuthUser };
    setUser(data.user);
  }, []);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (input: { email: string; password: string; assertedRole: AppRole }) => {
      const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        throw new Error(await parseError(res));
      }
      const data = (await res.json()) as { user: AuthUser };
      setUser(data.user);
    },
    [],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string; role: AppRole }) => {
      const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        throw new Error(await parseError(res));
      }
      const data = (await res.json()) as { user: AuthUser };
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
