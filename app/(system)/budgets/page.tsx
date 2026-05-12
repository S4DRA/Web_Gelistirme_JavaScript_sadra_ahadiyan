"use client";

import { useEffect, useState } from "react";
import { useFinanceMode } from "@/components/finance-mode-switcher";
import { PageShell } from "@/components/page-shell";

type Budget = {
  id: string;
  category: string;
  amount: number;
  period: "monthly" | "quarterly" | "yearly";
};

const initialForm = {
  category: "",
  amount: "",
  period: "monthly",
};
const personalBudgetCategories = [
  "Groceries",
  "Rent",
  "Utilities",
  "Restaurants",
  "Coffee",
  "Shopping",
  "Travel",
  "Subscriptions",
  "Gaming",
  "Gym",
  "Emergency Fund",
  "Debt Payment",
];

export default function BudgetsPage() {
  const financeMode = useFinanceMode();
  const isPersonalMode = financeMode === "personal";
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBudgets() {
      try {
        const response = await fetch("/api/budgets");

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load budgets.");
        }

        setBudgets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load budgets.");
      } finally {
        setLoading(false);
      }
    }

    function handleFinanceModeChange() {
      setLoading(true);
      void loadBudgets();
    }

    window.addEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    void loadBudgets();

    return () => {
      window.removeEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save budget.");
      }

      setBudgets((current) => {
        const withoutSame = current.filter(
          (budget) => !(budget.category === data.category && budget.period === data.period),
        );

        return [...withoutSame, data].sort((left, right) =>
          left.category.localeCompare(right.category),
        );
      });
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget.");
    } finally {
      setSaving(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  }

  return (
    <PageShell
      title={isPersonalMode ? "Spending Plans" : "Budgets"}
      description={
        isPersonalMode
          ? "Set gentle monthly limits for bills, lifestyle spending, savings, and goals."
          : "Set category limits and let insights warn users before spend gets uncomfortable."
      }
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-slate-900">
            {isPersonalMode ? "Add spending plan" : "Add budget"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPersonalMode
              ? "Use the same simple category names you use when adding money moves."
              : "Use the same category names you use in transactions for best results."}
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-[1fr_12rem_12rem_auto]" onSubmit={handleSubmit}>
          <input
            required
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
            className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            placeholder={isPersonalMode ? "Groceries" : "Software"}
          />
          <input
            required
            min="0.01"
            step="0.01"
            type="number"
            value={form.amount}
            onChange={(event) =>
              setForm((current) => ({ ...current, amount: event.target.value }))
            }
            className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="400.00"
          />
          <select
            value={form.period}
            onChange={(event) =>
              setForm((current) => ({ ...current, period: event.target.value }))
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
        {isPersonalMode ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {personalBudgetCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setForm((current) => ({ ...current, category }))}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                {category}
              </button>
            ))}
          </div>
        ) : null}
        {error ? <div className="mt-4 text-sm text-rose-600">{error}</div> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-medium text-slate-900">
            {isPersonalMode ? "Plans list" : "Budget list"}
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            {isPersonalMode ? "Loading spending plans..." : "Loading budgets..."}
          </div>
        ) : budgets.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            {isPersonalMode ? "No spending plans yet." : "No budgets yet."}
          </div>
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <article key={budget.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-lg font-semibold text-slate-900">{budget.category}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {formatCurrency(budget.amount)}
                </p>
                <p className="mt-2 text-sm capitalize text-slate-500">{budget.period}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
