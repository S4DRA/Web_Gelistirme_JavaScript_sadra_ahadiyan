"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";

type RecurringItem = {
  id: string;
  name: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  frequency: "weekly" | "monthly" | "yearly";
  nextDate: string;
  active: boolean;
};

const initialForm = {
  name: "",
  amount: "",
  type: "expense",
  category: "",
  frequency: "monthly",
  nextDate: "",
};

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadItems() {
      try {
        const response = await fetch("/api/recurring-transactions");

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load recurring transactions.");
        }

        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recurring items.");
      } finally {
        setLoading(false);
      }
    }

    void loadItems();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

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
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recurring item.");
    } finally {
      setSaving(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  }

  return (
    <PageShell
      title="Recurring"
      description="Model predictable income and costs so forecasts become useful before money moves."
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-slate-900">Add recurring item</h2>
          <p className="mt-1 text-sm text-slate-500">
            Salaries, rent, subscriptions, retainers, and other expected movements.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
          <input
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="Office rent"
          />
          <input
            required
            min="0.01"
            step="0.01"
            type="number"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="1200.00"
          />
          <input
            required
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
            className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="Rent"
          />
          <select
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
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
          <input
            required
            type="date"
            value={form.nextDate}
            onChange={(event) => setForm((current) => ({ ...current, nextDate: event.target.value }))}
            className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
          />
          <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm text-rose-600">{error}</div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add recurring item"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-medium text-slate-900">Recurring list</h2>
        </div>
        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">Loading recurring items...</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">No recurring items yet.</div>
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
                  {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
