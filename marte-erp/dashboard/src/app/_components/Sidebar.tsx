"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import {
  IconDashboard,
  IconPalette,
  IconFrame,
  IconArrowsUpDown,
  IconUsers,
} from "./Icons";

const navItems = [
  { section: "PAINEL", links: [
    { href: "/", label: "Dashboard", icon: IconDashboard, exact: true },
  ]},
  { section: "GESTÃO", links: [
    { href: "/estoque", label: "Estoque", icon: IconPalette, exact: false },
    { href: "/quadros", label: "Produtos", icon: IconFrame, exact: false },
    { href: "/movimentacoes", label: "Movimentações", icon: IconArrowsUpDown, exact: false },
  ]},
  { section: "ADMINISTRAÇÃO", links: [
    { href: "/usuarios", label: "Usuários", icon: IconUsers, exact: false },
  ]},
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
      <div className={styles.logoContainer}>
        <div className={styles.logo}>M</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.brandName}>MARTE ERP</div>
          <small style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 500 }}>
            Gestão para Moldurarias
          </small>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ section, links }) => (
          <div key={section} className={styles.navSection}>
            <span className={styles.sectionTitle}>{section}</span>
            {links.map(({ href, label, icon: Icon, exact }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.navLink} ${isActive(href, exact) ? styles.activeLink : ""}`}
              >
                <span className={styles.navIcon}>
                  <Icon size={18} />
                </span>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.systemStatus}>
          <div className={styles.statusDot}></div>
          <span>Sistema Online</span>
        </div>
      </div>
    </aside>
  );
}
