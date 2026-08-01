"use client";

import { useEffect, useState } from "react";
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
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Open by default on desktop after hydration
  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 768);
  }, []);

  // Close automatically on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <div className={styles.appContainer}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <button
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Alternar menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1>Gestão de Estoque</h1>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>{initial}</div>
              <span className={styles.userName}>{user?.nome ?? "Usuário"}</span>
            </div>
            <button onClick={logout} className={styles.logoutBtn}>
              Sair
            </button>
          </div>
        </header>
        <div className={styles.contentArea}>{children}</div>
      </main>
    </div>
  );
}
