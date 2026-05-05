"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";

const initialForm = {
  folderName: "",
  currency: "USD",
  startingBalance: "",
  monthlyFixedExpenses: "",
};

export function OnboardingForm() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderName: form.folderName,
          currency: form.currency,
          startingBalance: Number(form.startingBalance || 0),
          monthlyFixedExpenses: Number(form.monthlyFixedExpenses || 0),
        }),
      });
      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to save onboarding.");
      }

      window.location.assign("/trackings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save onboarding.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex flex-1 bg-slate-50 px-6 py-12">
      <section className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-[1fr_460px] md:items-center">
        <div className="space-y-5">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            Quick setup
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Shape Dampener around how you track money.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            Choose a theme and add the financial basics. The tracking folder name is
            optional; skip it and your Trackings section starts empty.
          </p>
          <div className="inline-flex">
            <ThemeSwitcher />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Start tracking
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              Add only what you know now. You can refine the setup later.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Tracking folder name
              <input
                type="text"
                value={form.folderName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, folderName: event.target.value }))
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Personal cash flow"
              />
              <span className="text-xs font-normal text-slate-500">
                Optional. Leave blank to keep Trackings empty.
              </span>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Currency
              <select
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currency: event.target.value }))
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="TRY">TRY</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Starting balance
              <input
                min="0"
                step="0.01"
                type="number"
                value={form.startingBalance}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startingBalance: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="0.00"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Monthly fixed expenses
              <input
                min="0"
                step="0.01"
                type="number"
                value={form.monthlyFixedExpenses}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    monthlyFixedExpenses: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="0.00"
              />
            </label>
          </div>

          <div className="mt-5 min-h-6 text-sm text-rose-600">{error}</div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:flex-1"
            >
              {saving ? "Saving..." : "Save setup"}
            </button>
            <Link
              href="/trackings"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 sm:flex-1"
            >
              Skip
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
