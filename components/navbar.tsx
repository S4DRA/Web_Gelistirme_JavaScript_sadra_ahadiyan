"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { FinanceModeSwitcher, useFinanceMode } from "@/components/finance-mode-switcher";

const navItems = [
  { href: "/dashboard", icon: "apps", label: "Dashboard" },
  { href: "/workspaces", icon: "building", label: "Workspaces" },
  { href: "/insights", icon: "analyse", label: "Insights" },
  { href: "/transactions", icon: "wallet", label: "Transactions" },
  { href: "/recurring", icon: "refresh", label: "Recurring" },
  { href: "/budgets", icon: "calculator-money", label: "Budgets" },
  { href: "/trackings", icon: "folder-open", label: "Trackings" },
  { href: "/invoices", icon: "file-invoice", label: "Invoices" },
  { href: "/reports", icon: "document", label: "Reports" },
  { href: "/team", icon: "users", label: "Team" },
  { href: "/onboarding", icon: "rocket-lunch", label: "Setup" },
];

const mobileQuickItems = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/insights", icon: "chart-histogram", label: "Insights" },
  { href: "/transactions", icon: "add", label: "Add" },
  { href: "/invoices", icon: "receipt", label: "Bills" },
];

export function Navbar() {
  const pathname = usePathname();
  const financeMode = useFinanceMode();
  const [email, setEmail] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function loadUser() {
    try {
      const response = await fetch("/api/auth/me");

      if (!response.ok) {
        setEmail(null);
        setProfileImage(null);
        setUsername(null);
        return;
      }

      const data = await response.json();
      setEmail(data.user.email);
      setProfileImage(data.user.profileImage ?? null);
      setUsername(data.user.username ?? null);
    } catch {
      setEmail(null);
      setProfileImage(null);
      setUsername(null);
    } finally {
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadUser();
    }, 0);

    function handleProfileUpdate() {
      void loadUser();
    }

    window.addEventListener("dampener-profile-updated", handleProfileUpdate);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("dampener-profile-updated", handleProfileUpdate);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmail(null);
    setProfileImage(null);
    setUsername(null);
    window.location.assign("/login");
  }

  function renderProfileAvatar(className = "") {
    return profileImage ? (
      <Image
        src={profileImage}
        alt=""
        width={40}
        height={40}
        className={`profile-avatar object-cover ${className}`}
        unoptimized
      />
    ) : (
      <span className={`profile-avatar profile-avatar-fallback ${className}`}>
        <AppIcon name="user" />
      </span>
    );
  }

  function isActiveRoute(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function navLinkClass(baseClassName: string, href: string) {
    return `${baseClassName} ${isActiveRoute(href) ? "is-active" : ""}`;
  }

  const visibleNavItems = navItems.filter((item) => {
    if (financeMode === "personal") {
      return !["/workspaces", "/invoices", "/team"].includes(item.href);
    }

    return true;
  });
  const visibleMobileQuickItems = mobileQuickItems.filter((item) => {
    if (financeMode === "personal") {
      return item.href !== "/invoices";
    }

    return true;
  });

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

          <nav aria-label="Sidebar" className="sidebar-nav mt-8 grid gap-2">
            {visibleNavItems.map((item) => {
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={navLinkClass(
                    "sidebar-link gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
                    item.href,
                  )}
                >
                  <AppIcon name={item.icon} className="text-base" solid={active} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer mt-auto grid gap-2">
            <div className="sidebar-profile flex items-center gap-3 px-4 py-3">
              {renderProfileAvatar("h-10 w-10")}
              <span className="min-w-0 truncate text-sm font-medium text-slate-700">
                {username ?? email}
              </span>
            </div>
            <Link
              href="/settings"
              aria-current={isActiveRoute("/settings") ? "page" : undefined}
              className={navLinkClass(
                "sidebar-link gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
                "/settings",
              )}
            >
              <AppIcon
                name="settings"
                className="text-base"
                solid={isActiveRoute("/settings")}
              />
              Settings
            </Link>
          </div>
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
              <FinanceModeSwitcher compact />
              <div className="desktop-nav-links flex items-center gap-2">
                {visibleMobileQuickItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActiveRoute(item.href) ? "page" : undefined}
                    className={navLinkClass(
                      "app-nav-link inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
                      item.href,
                    )}
                  >
                    <AppIcon
                      name={item.icon}
                      className="text-sm"
                      solid={isActiveRoute(item.href)}
                    />
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
                    <AppIcon name="menu-burger" className="text-sm" />
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
                    {visibleNavItems.map((item) => {
                      const active = isActiveRoute(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          tabIndex={menuOpen ? 0 : -1}
                          aria-current={active ? "page" : undefined}
                          className={navLinkClass(
                            "app-nav-link inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
                            item.href,
                          )}
                        >
                          <AppIcon name={item.icon} className="text-sm" solid={active} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className={`profile-menu relative ${profileOpen ? "is-open" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((current) => !current)}
                    className="profile-menu-button account-chip flex max-w-48 items-center justify-center gap-3 truncate rounded-full px-4 py-2 text-sm font-medium text-slate-600"
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                  >
                    {renderProfileAvatar("h-7 w-7")}
                    <span className="truncate">{username ?? email}</span>
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
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <AppIcon name="settings" />
                        Settings
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleLogout()}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <AppIcon name="sign-out-alt" />
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
                  Login
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {email ? (
        <nav
          aria-label="Mobile quick navigation"
          className={`mobile-bottom-nav ${financeMode === "personal" ? "is-personal" : ""}`}
        >
          {visibleMobileQuickItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setProfileOpen(false)}
                className={`mobile-bottom-link ${active ? "is-active" : ""}`}
              >
                <AppIcon name={item.icon} className="mobile-bottom-icon" solid={active} />
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/settings"
            onClick={() => setProfileOpen(false)}
            className={`mobile-bottom-link mobile-profile-trigger ${
              pathname === "/settings" ? "is-active" : ""
            }`}
          >
            {profileImage ? (
              <Image
                src={profileImage}
                alt=""
                width={24}
                height={24}
                className="mobile-bottom-avatar"
                unoptimized
              />
            ) : (
              <AppIcon
                name="user"
                className="mobile-bottom-icon"
                solid={pathname === "/settings"}
              />
            )}
            Profile
          </Link>
        </nav>
      ) : null}

    </>
  );
}
