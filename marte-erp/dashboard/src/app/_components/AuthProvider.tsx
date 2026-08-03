"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

const TOKEN_KEY = "marte_auth_token";

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  cargo: "admin" | "funcionario";
  ativo: boolean;
  criadoEm: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }
    api
      .get<AuthUser>('/auth/me', storedToken)
      .then((userData) => {
        setToken(storedToken);
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, senha: string) => {
      const data = await api.post<{ access_token: string; user: AuthUser }>(
        '/auth/login',
        null,
        { email, senha },
      );
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      router.push("/");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const isAuthenticated = useCallback(() => !!token && !!user, [token, user]);
  const isAdmin = useCallback(() => user?.cargo === "admin", [user]);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, isAuthenticated, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
