"use client";

import Link from "next/link";
import { useState } from "react";
import { InteractiveLogo3D } from "@/components/interactive-logo-3d";

type AuthFormProps = {
  mode: "login" | "signup";
};

const copy = {
  login: {
    title: "Log in",
    description: "Welcome back. Pick up where your cash flow left off.",
    button: "Log in",
    pending: "Logging in...",
    endpoint: "/api/auth/login",
    alternateText: "Need an account?",
    alternateHref: "/signup",
    alternateLabel: "Sign up",
  },
  signup: {
    title: "Sign up",
    description: "Create an account to keep your financial data private.",
    button: "Create account",
    pending: "Creating account...",
    endpoint: "/api/auth/signup",
    alternateText: "Already have an account?",
    alternateHref: "/login",
    alternateLabel: "Log in",
  },
};

export function AuthForm({ mode }: AuthFormProps) {
  const content = copy[mode];
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(content.endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, username, phoneNumber }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      const sessionResponse = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!sessionResponse.ok) {
        throw new Error("Your session was not saved. Refresh the page and try again.");
      }

      window.location.assign(mode === "signup" ? "/onboarding" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 bg-slate-50 px-6 py-12">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1fr_420px]">
        <div className="max-w-xl space-y-5">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            Dampener accounts
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Keep every cash flow workspace tied to the right person.
          </h1>
          <p className="text-lg leading-8 text-slate-600">
            Sign in to manage transactions, invoices, forecasts, and resets from your
            own account.
          </p>
          <div className="brand-lockup-card hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:block">
            <InteractiveLogo3D compact />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {content.title}
            </h2>
            <p className="text-sm leading-6 text-slate-500">{content.description}</p>
          </div>

          <div className="mt-6 grid gap-4">
            {mode === "signup" ? (
              <>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Username
                  <input
                    required
                    minLength={3}
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                    placeholder="sadra"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Phone number
                  <input
                    required
                    type="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                    placeholder="+1 555 123 4567"
                  />
                </label>
              </>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="you@example.com"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                required
                minLength={mode === "signup" ? 8 : undefined}
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                placeholder={mode === "signup" ? "At least 8 characters" : "Password"}
              />
            </label>

          </div>

          <div className="mt-5 min-h-6 text-sm text-rose-600">{error}</div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? content.pending : content.button}
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            {content.alternateText}{" "}
            <Link
              href={content.alternateHref}
              className="font-medium text-slate-900 hover:text-slate-700"
            >
              {content.alternateLabel}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
