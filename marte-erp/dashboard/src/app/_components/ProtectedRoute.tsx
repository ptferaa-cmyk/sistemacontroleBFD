"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Se true, exige que o usuário seja administrador */
  adminOnly?: boolean;
}

/**
 * Componente guard: redireciona para /login se não autenticado.
 * Com adminOnly=true, redireciona para / se o cargo não for admin.
 */
export default function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    if (adminOnly && !isAdmin()) {
      router.replace("/");
    }
  }, [loading, isAuthenticated, isAdmin, adminOnly, router]);

  // Enquanto verifica auth, mostra tela de carregamento
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0F172A",
          color: "#94A3B8",
          flexDirection: "column",
          gap: "1rem",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, #0891B2, #06B6D4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 800,
            fontSize: "1.35rem",
            boxShadow: "0 0 25px rgba(8,145,178,.45)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          M
        </div>
        <span style={{ fontSize: "0.9rem" }}>Verificando sessão...</span>
      </div>
    );
  }

  if (!isAuthenticated()) return null;
  if (adminOnly && !isAdmin()) return null;

  return <>{children}</>;
}
