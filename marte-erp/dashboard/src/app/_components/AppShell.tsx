"use client";

import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "./AuthProvider";
import { ToastProvider } from "./Toast";
import ProtectedRoute from "./ProtectedRoute";
import Sidebar from "./Sidebar";
import styles from "../layout.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Shell>{children}</Shell>
      </ToastProvider>
    </AuthProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const initial = user?.nome?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className={styles.appContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <h1>Gestão de Estoque</h1>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>{initial}</div>
              <span>{user?.nome ?? "Usuário"}</span>
            </div>
            <button
              onClick={logout}
              style={{
                marginLeft: "12px",
                padding: "6px 14px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "6px",
                color: "#EF4444",
                fontSize: "0.8rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sair
            </button>
          </div>
        </header>
        <div className={styles.contentArea}>{children}</div>
      </main>
    </div>
  );
}
