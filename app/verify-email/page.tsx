"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedDevCode = window.sessionStorage.getItem(
      "dampener-dev-verification-code",
    );

    const frame = requestAnimationFrame(() => {
      if (storedDevCode) {
        setDevCode(storedDevCode);
      }
    });

    async function loadUser() {
      const response = await fetch("/api/auth/me");

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const data = await response.json();
      setEmail(data.user.email);

      if (data.user.emailVerified) {
        window.location.assign("/dashboard");
      }
    }

    void loadUser();

    return () => cancelAnimationFrame(frame);
  }, []);

  async function verifyEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify email.");
      }

      window.sessionStorage.removeItem("dampener-dev-verification-code");
      window.location.assign("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify email.");
    } finally {
      setSaving(false);
    }
  }

  async function resendCode() {
    setError("");
    const response = await fetch("/api/auth/verify-email", { method: "PUT" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Failed to resend code.");
      return;
    }

    setDevCode(data.devCode || "");

    if (data.devCode) {
      window.sessionStorage.setItem("dampener-dev-verification-code", data.devCode);
    }
  }

  return (
    <PageShell
      title="Verify email"
      description={`Enter the 6 digit code sent to ${email || "your email"} before using Dampener.`}
    >
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={verifyEmail}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Verification code
            <input
              required
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="123456"
            />
          </label>

          {devCode ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Development code: {devCode}
            </div>
          ) : null}

          <div className="mt-5 min-h-6 text-sm text-rose-600">{error}</div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {saving ? "Verifying..." : "Verify email"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void resendCode()}
          className="mt-4 w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          Resend code
        </button>
      </section>
    </PageShell>
  );
}
