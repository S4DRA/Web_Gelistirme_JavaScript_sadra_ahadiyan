"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function redirectLoggedInUser() {
      try {
        const response = await fetch("/api/auth/me");

        if (response.ok) {
          window.location.assign("/dashboard");
          return;
        }
      } finally {
        setCheckingSession(false);
      }
    }

    void redirectLoggedInUser();
  }, []);

  if (checkingSession) {
    return <main className="flex flex-1 bg-slate-50" />;
  }

  return (
    <main className="flex flex-1 bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-center gap-8 px-6 py-20">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            Cash flow made clearer
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Dampener helps teams stay ahead of cash flow.
          </h1>
          <p className="text-lg leading-8 text-slate-600">
            Track income, monitor invoices, and get a simple picture of what your cash
            position looks like next.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
