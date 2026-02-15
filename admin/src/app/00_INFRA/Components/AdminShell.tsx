"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "../Context/AuthContext"
import styles from "./AdminShell.module.css"
import { useEffect, useMemo, useRef, useState } from "react"
import { ThemeToggle } from "./ThemeToggle"

const navSections = [
  {
    title: "Principale",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h7v7H4v-7zm9 5h7v2h-7v-2zm0-4h7v2h-7v-2z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Opération",
    items: [
      {
        label: "Produits",
        href: "/dashboard/products",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18l-2 6H5L3 6zm2 8h14v4H5v-4zm4 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
          </svg>
        ),
      },
      {
        label: "Commandes",
        href: "/dashboard/orders",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 4h12v14H6V4zm2 2v2h8V6H8zm0 4v2h8v-2H8zm0 4v2h5v-2H8z" />
          </svg>
        ),
      },
      {
        label: "Utilisateurs",
        href: "/dashboard/users",
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm-12 9c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6v1H4v-1z" />
          </svg>
        ),
      },
    ],
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const displayName = user?.displayName || user?.email || (loading ? "Chargement..." : "Invité")

  const activeLabel = useMemo(() => {
    for (const section of navSections) {
      const match = section.items.find((item) =>
        item.href === "/dashboard"
          ? pathname === item.href
          : pathname === item.href || pathname?.startsWith(item.href + "/"),
      )
      if (match) return match.label
    }
    return "Dashboard"
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false)
      }
    }
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  const handleLogout = async () => {
    if (loading) return
    try {
      await logout()
    } finally {
      setMenuOpen(false)
    }
  }

  if (pathname === "/") {
    return <>{children}</>
  }

  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""}`}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        <div className={styles.brandRow}>
          <Link className={styles.brandIcon} href="/dashboard" aria-label="Aller au dashboard">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 3h6v2l-2 2v2.2l4.7 7.8A2 2 0 0 1 15.9 20H8.1a2 2 0 0 1-1.7-3l4.7-7.8V7L9 5V3zm2.5 10.5a2.5 2.5 0 1 0 2.5 2.5 2.5 2.5 0 0 0-2.5-2.5z" />
            </svg>
          </Link>
          <div className={styles.brand}>PotionGo</div>
        </div>

        <nav className={styles.nav}>
          {navSections.map((section) => (
            <div className={styles.navSection} key={section.title}>
              <div className={styles.navTitle}>{section.title}</div>
              {section.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname === item.href || pathname?.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                    href={item.href}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <button
          className={styles.collapseBtnBottom}
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Déployer la navigation" : "Réduire la navigation"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </aside>

      <main className={styles.content}>
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span className={styles.crumbMuted}>Dashboard</span>
            <span className={styles.crumbDivider}>/</span>
            <span className={styles.crumbActive}>{activeLabel}</span>
          </div>

          <div className={styles.topbarRight}>
            <ThemeToggle className={styles.themeToggle} />
            <div className={styles.userMenu} ref={menuRef}>
              <button
                className={styles.userButton}
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className={styles.userInitial} aria-hidden="true">
                  {displayName?.[0]?.toUpperCase() ?? "?"}
                </span>
              </button>

              {menuOpen && (
                <div className={styles.menuPanel} role="menu">
                  <div className={styles.menuHeader}>
                    <div className={styles.menuName}>{displayName}</div>
                    <div className={styles.menuRole}>Administrateur</div>
                  </div>
                  <Link className={styles.menuItem} href="/dashboard/settings">
                    Paramètres du profil
                  </Link>
                  <button
                    className={styles.menuItemDanger}
                    type="button"
                    onClick={handleLogout}
                    disabled={loading}
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.pageBody}>{children}</div>
      </main>
    </div>
  )
}
