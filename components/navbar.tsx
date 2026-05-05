"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workspaces", label: "Workspaces" },
  { href: "/insights", label: "Insights" },
  { href: "/transactions", label: "Transactions" },
  { href: "/recurring", label: "Recurring" },
  { href: "/budgets", label: "Budgets" },
  { href: "/trackings", label: "Trackings" },
  { href: "/invoices", label: "Invoices" },
  { href: "/reports", label: "Reports" },
  { href: "/team", label: "Team" },
  { href: "/onboarding", label: "Setup" },
  { href: "/settings", label: "Settings" },
];

const mobileQuickItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/insights", label: "Insights" },
  { href: "/transactions", label: "Add" },
  { href: "/invoices", label: "Bills" },
];

export function Navbar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          setEmail(null);
          return;
        }

        const data = await response.json();
        setEmail(data.user.email);
      } catch {
        setEmail(null);
      } finally {
        setLoadingUser(false);
      }
    }

    void loadUser();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmail(null);
    window.location.assign("/login");
  }

  return (
    <>
      {email ? (
        <aside
          className={`app-sidebar border-r border-slate-200 bg-white/90 backdrop-blur ${
            sidebarOpen ? "is-open" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>

          <Link
            href="/dashboard"
            className="app-sidebar-brand text-lg font-semibold tracking-tight text-slate-900"
          >
            <Image src="/img/1.svg" alt="" width={32} height={32} className="brand-mark" />
            Dampener
          </Link>

          <nav aria-label="Sidebar" className="mt-8 grid gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="sidebar-link rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
      ) : null}

      <header className="app-header border-b border-slate-200 bg-white/90 backdrop-blur">
        <div
          className={`app-header-inner mx-auto grid w-full max-w-6xl items-center gap-4 px-6 py-4 ${
            sidebarOpen ? "is-sidebar-open" : ""
          }`}
        >
          <div className="app-brand-wrap flex items-center gap-3">
            <Link
              href={email ? "/dashboard" : "/"}
              className="app-brand text-lg font-semibold tracking-tight text-slate-900"
            >
              <Image src="/img/1.svg" alt="" width={32} height={32} className="brand-mark" />
              Dampener
            </Link>
            {email ? (
              <button
                type="button"
                onClick={() => setSidebarOpen((current) => !current)}
                className="sidebar-toggle-button flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                aria-expanded={sidebarOpen}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 border-b border-r border-current transition-transform ${
                    sidebarOpen ? "rotate-135" : "-rotate-45"
                  }`}
                />
              </button>
            ) : null}
          </div>

        <nav aria-label="Primary" className="app-nav flex flex-wrap items-center gap-2">
          {email ? (
            <>
              <div className="desktop-nav-links flex items-center gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="app-nav-link rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div
                className={`dashboard-menu flex flex-wrap items-center gap-2 ${
                  menuOpen ? "is-open" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setMenuOpen((current) => !current)}
                    className="dashboard-menu-button app-nav-link flex items-center justify-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                  >
                    Menu
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 border-b border-r border-current transition-transform ${
                        menuOpen ? "-rotate-135" : "rotate-45"
                      }`}
                    />
                  </button>

                  <div
                    role="menu"
                    className="dashboard-menu-list flex flex-wrap items-center gap-2"
                    aria-hidden={!menuOpen}
                  >
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        tabIndex={menuOpen ? 0 : -1}
                        className="app-nav-link rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className={`profile-menu relative ${profileOpen ? "is-open" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((current) => !current)}
                    className="profile-menu-button account-chip flex max-w-48 items-center justify-center gap-3 truncate rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600"
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                  >
                    <span className="truncate">{email}</span>
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 border-b border-r border-current transition-transform ${
                        profileOpen ? "-rotate-135" : "rotate-45"
                      }`}
                    />
                  </button>

                  {profileOpen ? (
                    <div
                      role="menu"
                      className="profile-menu-list absolute right-0 top-[calc(100%+0.5rem)] z-30 grid w-48 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
                    >
                      <Link
                        href="/settings"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        Settings
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleLogout()}
                        className="rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        Log out
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : loadingUser ? null : (
              <div className="auth-nav-actions flex items-center gap-3">
                <Link
                  href="/login"
                  className="app-nav-link auth-nav-link rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="app-nav-link auth-nav-link auth-nav-link-primary rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {email ? (
        <nav aria-label="Mobile quick navigation" className="mobile-bottom-nav">
          {mobileQuickItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-bottom-link ${active ? "is-active" : ""}`}
              >
                <span aria-hidden="true" className="mobile-bottom-dot" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}
