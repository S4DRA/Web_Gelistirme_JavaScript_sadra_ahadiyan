"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { PageShell } from "@/components/page-shell";

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
};

const initialForm = {
  amount: "",
  type: "income",
  category: "",
  date: "",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importCsv, setImportCsv] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      try {
        setError("");

        const response = await fetch("/api/transactions");

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load transactions.");
        }

        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(form.amount),
          type: form.type,
          category: form.category,
          date: form.date,
        }),
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create transaction.");
      }

      setTransactions((current) => [data, ...current]);
      setForm(initialForm);
      setSuccessMessage("Transaction added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create transaction.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImporting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/transactions/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv: importCsv }),
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import transactions.");
      }

      const transactionsResponse = await fetch("/api/transactions");
      const transactionsData = await transactionsResponse.json();

      if (!transactionsResponse.ok) {
        throw new Error(transactionsData.error || "Failed to reload transactions.");
      }

      setTransactions(transactionsData);
      setImportCsv("");
      setSuccessMessage(`Imported ${data.imported} transactions.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import transactions.");
    } finally {
      setImporting(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <PageShell
      title="Transactions"
      description="Add new income or expenses and review your latest transaction activity."
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="add" />
            Add transaction
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep cash flow records up to date with a simple form.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Amount
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
              placeholder="1200.00"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Type
            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as "income" | "expense",
                }))
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Category
            <input
              required
              type="text"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Consulting"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Date
            <input
              required
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>

          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm text-rose-600">{error}</div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Saving..." : "Add transaction"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="upload" />
            Import CSV
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Paste rows with headers: type, amount, category, date.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleImport}>
          <textarea
            value={importCsv}
            onChange={(event) => setImportCsv(event.target.value)}
            className="min-h-36 rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-400"
            placeholder={"type,amount,category,date\nincome,1200,Consulting,2026-05-08\nexpense,80,Software,2026-05-08"}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm text-emerald-700">{successMessage}</div>
            <button
              type="submit"
              disabled={importing}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {importing ? "Importing..." : "Import transactions"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="list" />
            Transaction list
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            No transactions yet. Add your first one above.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {transactions.map((transaction) => {
              const amountColor =
                transaction.type === "income" ? "text-emerald-600" : "text-rose-600";

              return (
                <article
                  key={transaction.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium capitalize text-slate-900">
                      {transaction.category}
                    </p>
                    <p className="text-sm text-slate-500">
                      {transaction.type} | {formatDate(transaction.date)}
                    </p>
                  </div>

                  <p className={`text-lg font-semibold ${amountColor}`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
