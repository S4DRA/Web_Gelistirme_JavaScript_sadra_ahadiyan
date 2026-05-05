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
  const [loginCode, setLoginCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [awaitingLoginCode, setAwaitingLoginCode] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (mode === "login" && awaitingLoginCode) {
        const response = await fetch("/api/auth/login/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code: loginCode }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Authentication failed.");
        }

        window.location.assign("/dashboard");
        return;
      }

      const response = await fetch(content.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, username, phoneNumber }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      if (data.requiresEmailVerification) {
        if (data.devCode) {
          setDevCode(data.devCode);
          window.sessionStorage.setItem("dampener-dev-verification-code", data.devCode);
        }

        window.location.assign("/verify-email");
        return;
      }

      if (data.requiresLoginCode) {
        setAwaitingLoginCode(true);
        setDevCode(data.devCode || "");
        return;
      }

      window.location.assign(mode === "signup" ? "/verify-email" : "/dashboard");
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
                disabled={awaitingLoginCode}
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
                disabled={awaitingLoginCode}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                placeholder={mode === "signup" ? "At least 8 characters" : "Password"}
              />
            </label>

            {mode === "login" && awaitingLoginCode ? (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Email login code
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={loginCode}
                  onChange={(event) => setLoginCode(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="123456"
                />
              </label>
            ) : null}
          </div>

          {devCode ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Development code: {devCode}
            </div>
          ) : null}

          <div className="mt-5 min-h-6 text-sm text-rose-600">{error}</div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting
              ? content.pending
              : awaitingLoginCode
                ? "Verify login code"
                : content.button}
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
