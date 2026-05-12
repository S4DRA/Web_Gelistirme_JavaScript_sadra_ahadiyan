"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AppIcon } from "@/components/app-icon";

const initialForm = {
  companyName: "",
  email: "",
  fullName: "",
  message: "",
  role: "",
  useCase: "",
};

export function RequestAccessForm() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/access-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send request.");
      }

      setSubmitted(true);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 bg-slate-50 px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
      <section className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <div className="auth-visual-panel relative bg-slate-950 p-6 text-white sm:p-8 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.28),transparent_24rem)]" />
          <div className="relative flex h-full min-h-[24rem] flex-col justify-between gap-10">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold">
                <span className="auth-brand-icon inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
                  <AppIcon name="chart-histogram" />
                </span>
                Dampener
              </Link>
              <div className="mt-12 max-w-xl">
                <span className="auth-eyebrow inline-flex rounded-full border border-emerald-300/30 bg-white/10 px-3 py-1 text-sm font-medium text-emerald-200">
                  Request access
                </span>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                  Get approved before creating your workspace.
                </h1>
                <p className="auth-lead mt-5 text-lg leading-8 text-slate-300">
                  Tell us who you are and how you plan to use Dampener. If approved,
                  you will receive a private signup link by email.
                </p>
              </div>
            </div>

            <div className="auth-preview-card grid gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              {["Private signup links", "Admin-reviewed requests", "Login stays open"].map(
                (item) => (
                  <div key={item} className="auth-preview-muted flex items-center gap-3 text-sm font-medium text-slate-200">
                    <AppIcon name="check" className="text-emerald-300" />
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              <AppIcon name="arrow-left" />
              Return
            </Link>
            <a
              href="/login"
              className="inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Login
            </a>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold leading-6 text-emerald-800">
              Your request has been sent. If approved, you will receive an email with signup access.
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Request access
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  We review each request before opening account creation.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Full name
                  <input
                    required
                    value={form.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Ada Lovelace"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Email
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="you@example.com"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Company / project name
                  <input
                    required
                    value={form.companyName}
                    onChange={(event) => updateField("companyName", event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Studio North"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Role or job title
                  <input
                    required
                    value={form.role}
                    onChange={(event) => updateField("role", event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Founder"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                How do you plan to use Dampener?
                <textarea
                  required
                  value={form.useCase}
                  onChange={(event) => updateField("useCase", event.target.value)}
                  className="min-h-32 resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Tell us about your workflow, team, or financial tracking needs."
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Optional message
                <textarea
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  className="min-h-24 resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Anything else you want us to know"
                />
              </label>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="auth-submit-button mt-2 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? "Sending..." : "Request Access"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
