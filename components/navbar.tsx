"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/invoices", label: "Invoices" },
];

export function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

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
    <header className="app-header border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="app-header-inner mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="app-brand text-lg font-semibold tracking-tight text-slate-900"
        >
          Dampener
        </Link>

        <nav
          aria-label="Primary"
          className="app-nav flex flex-wrap items-center gap-2"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="app-nav-link rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}

          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

          {email ? (
            <>
              <span className="account-chip max-w-48 truncate rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                {email}
              </span>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="logout-button rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Log out
              </button>
            </>
          ) : loadingUser ? null : (
            <>
              <Link
                href="/login"
                className="app-nav-link rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="app-nav-link rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Sign up
              </Link>
            </>
          )}

          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
