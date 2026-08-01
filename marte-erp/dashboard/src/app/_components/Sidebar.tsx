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

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logo}>M</div>
        <div>
          <div className={styles.brandName}>MARTE ERP</div>
          <small style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 500 }}>
            Gestão para Moldurarias
          </small>
        </div>
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