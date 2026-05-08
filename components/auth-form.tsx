"use client";

import Link from "next/link";
import { useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { DemoRequestModal } from "@/components/demo-request-modal";

type AuthFormProps = {
  mode: "login" | "signup";
};

const copy = {
  login: {
    eyebrow: "Welcome back",
    title: "Log in to Dampener",
    description: "Continue managing cash flow, invoices, reports, and team workspaces.",
    button: "Login",
    pending: "Logging in...",
    endpoint: "/api/auth/login",
    alternateText: "Want a walkthrough?",
    alternateHref: "/signup",
    alternateLabel: "Sign up for demo",
  },
  signup: {
    eyebrow: "Create your workspace",
    title: "Start your Dampener account",
    description: "Create an account to keep financial data organized and private.",
    button: "Create account",
    pending: "Creating account...",
    endpoint: "/api/auth/signup",
    alternateText: "Already have an account?",
    alternateHref: "/login",
    alternateLabel: "Log in",
  },
};

const authHighlights = [
  "Cash flow overview",
  "Invoice and report tracking",
  "Workspace-level organization",
];

export function AuthForm({ mode }: AuthFormProps) {
  const content = copy[mode];
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      if (mode === "signup" && !codeSent) {
        const codeResponse = await fetch("/api/auth/signup/send-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, username }),
        });
        const codeData = await codeResponse.json();

        if (!codeResponse.ok) {
          throw new Error(codeData.error || "Failed to send verification code.");
        }

        setCodeSent(true);
        setNotice("We sent a 6-digit code to your email.");
        return;
      }

      const response = await fetch(content.endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          phoneNumber,
          username,
          verificationCode,
        }),
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
    <main className="flex flex-1 bg-slate-50 px-4 py-5 sm:px-6 sm:py-10 lg:py-14">
      <section className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_28rem]">
        <div className="relative hidden bg-slate-950 p-8 text-white sm:p-10 lg:block lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.28),transparent_26rem)]" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
                  <AppIcon name="chart-histogram" />
                </span>
                Dampener
              </Link>
              <div className="mt-14 max-w-xl">
                <span className="inline-flex rounded-full border border-emerald-300/30 bg-white/10 px-3 py-1 text-sm font-medium text-emerald-200">
                  {content.eyebrow}
                </span>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                  Your financial workspace, ready when you are.
                </h1>
                <p className="mt-5 text-lg leading-8 text-slate-300">
                  Keep every cash flow workspace tied to the right person, with the
                  context needed to understand what changed and what needs attention.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Net balance</span>
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                    Healthy
                  </span>
                </div>
                <p className="text-3xl font-semibold">$4,630</p>
                <div className="flex h-20 items-end gap-2">
                  {["h-8", "h-10", "h-7", "h-12", "h-14", "h-16", "h-11"].map((height) => (
                    <span key={height} className={`flex-1 rounded-t bg-emerald-400 ${height}`} />
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {authHighlights.map((highlight) => (
                  <div key={highlight} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <AppIcon name="check" className="text-emerald-300" />
                    <p className="mt-2 text-sm font-medium text-slate-200">{highlight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-col gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-lg font-semibold text-slate-950 lg:hidden"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <AppIcon name="chart-histogram" />
              </span>
              Dampener
            </Link>
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              <AppIcon name="arrow-left" />
              Return
            </Link>
          </div>

          <div>
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              Secure access
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {content.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{content.description}</p>
          </div>

          <div className="mt-7 grid gap-4 sm:mt-8">
            {mode === "signup" ? (
              <>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Username
                  <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                    <AppIcon name="user" className="text-slate-400" />
                    <input
                      required
                      minLength={3}
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="min-h-11 w-full border-0 bg-transparent px-0 py-3 text-slate-900 outline-none sm:min-h-12"
                      placeholder="alex-finance"
                    />
                  </span>
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Phone number
                  <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                    <AppIcon name="phone-call" className="text-slate-400" />
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      className="min-h-11 w-full border-0 bg-transparent px-0 py-3 text-slate-900 outline-none sm:min-h-12"
                      placeholder="+1 555 123 4567"
                    />
                  </span>
                </label>
              </>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                <AppIcon name="envelope" className="text-slate-400" />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setCodeSent(false);
                    setVerificationCode("");
                    setNotice("");
                  }}
                  disabled={mode === "signup" && codeSent}
                  className="min-h-11 w-full border-0 bg-transparent px-0 py-3 text-slate-900 outline-none disabled:cursor-not-allowed sm:min-h-12"
                  placeholder="you@example.com"
                />
              </span>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Password
              <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                <AppIcon name="lock" className="text-slate-400" />
                <input
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-11 w-full border-0 bg-transparent px-0 py-3 text-slate-900 outline-none sm:min-h-12"
                  placeholder={mode === "signup" ? "At least 8 characters" : "Password"}
                />
              </span>
            </label>

            {mode === "signup" && codeSent ? (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Verification code
                <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                  <AppIcon name="shield-check" className="text-slate-400" />
                  <input
                    required
                    inputMode="numeric"
                    maxLength={6}
                    minLength={6}
                    pattern="[0-9]{6}"
                    type="text"
                    autoComplete="one-time-code"
                    value={verificationCode}
                    onChange={(event) =>
                      setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="min-h-11 w-full border-0 bg-transparent px-0 py-3 text-slate-900 outline-none sm:min-h-12"
                    placeholder="123456"
                  />
                </span>
              </label>
            ) : null}
          </div>

          <div className="mt-5 min-h-6 text-sm font-medium text-emerald-700">{notice}</div>
          <div className="mt-2 min-h-6 text-sm font-medium text-rose-600">{error}</div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting
              ? mode === "signup" && !codeSent
                ? "Sending code..."
                : content.pending
              : mode === "signup" && !codeSent
                ? "Send verification code"
                : content.button}
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            {content.alternateText}{" "}
            {mode === "login" ? (
              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="font-medium text-slate-900 hover:text-slate-700"
              >
                {content.alternateLabel}
              </button>
            ) : (
              <Link
                href={content.alternateHref}
                className="font-medium text-slate-900 hover:text-slate-700"
              >
                {content.alternateLabel}
              </Link>
            )}
          </p>
        </form>
      </section>
      <DemoRequestModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </main>
  );
}
