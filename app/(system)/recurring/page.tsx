"use client";

import { useEffect, useState } from "react";
import { useFinanceMode } from "@/components/finance-mode-switcher";
import { PageShell } from "@/components/page-shell";

type RecurringItem = {
  id: string;
  name: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  currency: string;
  frequency: "weekly" | "monthly" | "yearly";
  nextDate: string;
  active: boolean;
};

const initialForm = {
  name: "",
  amount: "",
  currency: "USD",
  type: "expense",
  category: "",
  frequency: "monthly",
  nextDate: "",
};
const currencies = ["USD", "EUR", "TRY", "GBP", "IRR", "AED", "CAD", "AUD", "JPY", "CHF"];
const personalRecurringCategories = [
  "Rent",
  "Utilities",
  "Internet",
  "Phone Bills",
  "Insurance",
  "Subscriptions",
  "Gym",
  "Healthcare",
  "Salary",
  "Freelance",
];

export default function RecurringPage() {
  const financeMode = useFinanceMode();
  const isPersonalMode = financeMode === "personal";
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadItems() {
      try {
        const [response, currencyResponse] = await Promise.all([
          fetch("/api/recurring-transactions"),
          fetch("/api/currency"),
        ]);

        if (response.status === 401 || currencyResponse.status === 401) {
          window.location.assign("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load recurring transactions.");
        }

        setItems(data);

        if (currencyResponse.ok) {
          const currencyData = await currencyResponse.json();
          setForm((current) => ({ ...current, currency: currencyData.baseCurrency }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recurring items.");
      } finally {
        setLoading(false);
      }
    }

    function handleFinanceModeChange() {
      setLoading(true);
      void loadItems();
    }

    window.addEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    void loadItems();

    return () => {
      window.removeEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/recurring-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create recurring transaction.");
      }

      setItems((current) => [data, ...current]);
      setForm((current) => ({ ...initialForm, currency: current.currency }));
      setSuccessMessage("Recurring item added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recurring item.");
    } finally {
      setSaving(false);
    }
  }

  function formatCurrency(amount: number, currency = "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  }

  return (
    <PageShell
      title={isPersonalMode ? "Bills" : "Recurring"}
      description={
        isPersonalMode
          ? "Track rent, subscriptions, salary, and other money that repeats."
          : "Model predictable income and costs so forecasts become useful before money moves."
      }
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-slate-900">
            {isPersonalMode ? "Add bill or recurring money" : "Add recurring item"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPersonalMode
              ? "Add anything predictable so your daily money view feels more honest."
              : "Salaries, rent, subscriptions, retainers, and other expected movements."}
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Name
            <input
              required
              maxLength={80}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              placeholder={isPersonalMode ? "Netflix" : "Office rent"}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Amount
            <input
              required
              min="0.01"
              max="999999999.99"
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="1200.00"
            />
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
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Category
            <input
              required
              maxLength={80}
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Rent"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Type
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            >
              <option value="income">{isPersonalMode ? "Money In" : "Income"}</option>
              <option value="expense">{isPersonalMode ? "Money Out" : "Expense"}</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Frequency
            <select
              value={form.frequency}
              onChange={(event) =>
                setForm((current) => ({ ...current, frequency: event.target.value }))
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Next date
            <input
              required
              type="date"
              value={form.nextDate}
              onChange={(event) => setForm((current) => ({ ...current, nextDate: event.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>
          <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm font-medium">
              <span className="text-emerald-700">{successMessage}</span>
              <span className="text-rose-600">{error}</span>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add recurring item"}
            </button>
          </div>
        </form>
        {isPersonalMode ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {personalRecurringCategories.map((category) => (
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
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-medium text-slate-900">
            {isPersonalMode ? "Bills and repeats" : "Recurring list"}
          </h2>
        </div>
        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            {isPersonalMode ? "Loading bills..." : "Loading recurring items..."}
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            {isPersonalMode ? "No bills or repeating money yet." : "No recurring items yet."}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {items.map((item) => (
              <article key={item.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    {item.category} | {item.frequency} | next {new Date(item.nextDate).toLocaleDateString()}
                  </p>
                </div>
                <p className={item.type === "income" ? "text-emerald-600" : "text-rose-600"}>
                  {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount, item.currency)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
