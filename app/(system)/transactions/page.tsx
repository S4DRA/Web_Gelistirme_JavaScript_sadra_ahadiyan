"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { useFinanceMode } from "@/components/finance-mode-switcher";
import { PageShell } from "@/components/page-shell";

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  currency: string;
  date: string;
  note: string | null;
  originalAmount: number | null;
  originalCurrency: string | null;
};

type ImportPreviewRow = {
  amount: number;
  balance: number | null;
  category: string;
  convertedAmount: number;
  currency: string;
  date: string;
  description: string;
  duplicate: boolean;
  errors: string[];
  fingerprint: string;
  note: string | null;
  rowNumber: number;
  status: "ready" | "duplicate" | "invalid";
  type: "income" | "expense";
};

const currencies = ["USD", "EUR", "TRY", "GBP", "IRR", "AED", "CAD", "AUD", "JPY", "CHF"];
const personalEssentialCategories = [
  "Groceries",
  "Rent",
  "Utilities",
  "Internet",
  "Phone Bills",
  "Transportation",
  "Fuel",
  "Healthcare",
  "Insurance",
  "Education",
  "Subscriptions",
];
const personalLifestyleCategories = [
  "Restaurants",
  "Coffee",
  "Shopping",
  "Entertainment",
  "Gaming",
  "Travel",
  "Gym",
  "Hobbies",
  "Gifts",
  "Beauty / Skincare",
  "Clothing",
];
const personalIncomeCategories = [
  "Salary",
  "Freelance",
  "Side Hustle",
  "Investments",
  "Bonuses",
  "Family Support",
  "Passive Income",
];

const initialForm = {
  amount: "",
  category: "",
  currency: "USD",
  date: "",
  note: "",
  type: "income",
};

export default function TransactionsPage() {
  const financeMode = useFinanceMode();
  const isPersonalMode = financeMode === "personal";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState(initialForm);
  const [workspaceCurrency, setWorkspaceCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importCsv, setImportCsv] = useState("");
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      try {
        setError("");

        const [transactionsResponse, currencyResponse] = await Promise.all([
          fetch("/api/transactions"),
          fetch("/api/currency"),
        ]);

        if (transactionsResponse.status === 401 || currencyResponse.status === 401) {
          window.location.assign("/login");
          return;
        }

        const transactionData = await transactionsResponse.json();
        const currencyData = await currencyResponse.json();

        if (!transactionsResponse.ok) {
          throw new Error(transactionData.error || "Failed to load transactions.");
        }

        setTransactions(transactionData);

        if (currencyResponse.ok) {
          setWorkspaceCurrency(currencyData.baseCurrency);
          setForm((current) => ({ ...current, currency: currencyData.baseCurrency }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    }

    function handleFinanceModeChange() {
      setLoading(true);
      setPreviewRows([]);
      void loadTransactions();
    }

    window.addEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    void loadTransactions();

    return () => {
      window.removeEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    };
  }, []);

  async function reloadTransactions() {
    const response = await fetch("/api/transactions");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to reload transactions.");
    }

    setTransactions(data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/transactions", {
        body: JSON.stringify({
          amount: Number(form.amount),
          category: form.category,
          currency: form.currency,
          date: form.date,
          note: form.note,
          type: form.type,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
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
      setForm((current) => ({ ...initialForm, currency: current.currency }));
      setSuccessMessage("Transaction added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create transaction.");
    } finally {
      setSubmitting(false);
    }
  }

  async function previewImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreviewing(true);
    setError("");
    setSuccessMessage("");
    setPreviewRows([]);

    try {
      const formData = new FormData();

      if (importFile) {
        formData.append("file", importFile);
      } else if (importCsv.trim()) {
        formData.append(
          "file",
          new File([importCsv], "pasted-transactions.csv", { type: "text/csv" }),
        );
      } else {
        throw new Error("Upload a file or paste CSV rows first.");
      }

      const response = await fetch("/api/transactions/import", {
        body: formData,
        method: "POST",
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to preview import.");
      }

      setPreviewRows(data.rows);
      setSuccessMessage(
        `${data.summary.ready} ready, ${data.summary.duplicate} duplicates, ${data.summary.invalid} invalid.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview import.");
    } finally {
      setPreviewing(false);
    }
  }

  async function confirmImport() {
    setImporting(true);
    setError("");
    setSuccessMessage("");

    try {
      const rows = previewRows.filter((row) => row.status === "ready");
      const response = await fetch("/api/transactions/import", {
        body: JSON.stringify({ rows }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import transactions.");
      }

      await reloadTransactions();
      setImportCsv("");
      setImportFile(null);
      setPreviewRows([]);
      setSuccessMessage(`Imported ${data.imported} transactions. Skipped ${data.skipped}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import transactions.");
    } finally {
      setImporting(false);
    }
  }

  function formatCurrency(amount: number, currency = workspaceCurrency) {
    return new Intl.NumberFormat("en-US", {
      currency,
      style: "currency",
    }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <PageShell
      title={isPersonalMode ? "Money In & Out" : "Transactions"}
      description={
        isPersonalMode
          ? "Add everyday spending, income, bills, and savings notes in one calm place."
          : "Add new income or expenses and review your latest transaction activity."
      }
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="add" />
            {isPersonalMode ? "Add money move" : "Add transaction"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPersonalMode
              ? `Amounts are saved in ${workspaceCurrency}; use simple categories that match your life.`
              : `Amounts are stored in ${workspaceCurrency}; original currency is preserved.`}
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Amount
            <input
              required
              max="999999999.99"
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
              <option value="income">{isPersonalMode ? "Money In" : "Income"}</option>
              <option value="expense">{isPersonalMode ? "Money Out" : "Expense"}</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-3">
            Category
            <input
              required
              maxLength={80}
              type="text"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              placeholder={isPersonalMode ? "Groceries" : "Consulting"}
            />
            {isPersonalMode ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  {(form.type === "income" ? personalIncomeCategories : personalEssentialCategories).map(
                    (category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, category }))}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                      >
                        {category}
                      </button>
                    ),
                  )}
                </div>
                {form.type === "expense" ? (
                  <div className="flex flex-wrap gap-2">
                    {personalLifestyleCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, category }))}
                        className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:border-rose-200 hover:bg-white"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
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

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Note
            <input
              maxLength={500}
              type="text"
              value={form.note}
              onChange={(event) =>
                setForm((current) => ({ ...current, note: event.target.value }))
              }
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Optional"
            />
          </label>

          <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm text-rose-600">{error}</div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Saving..." : isPersonalMode ? "Add" : "Add transaction"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="upload" />
            {isPersonalMode ? "Import money history" : "Import transactions"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPersonalMode
              ? "Upload .xlsx or .csv, preview it first, then bring it into your personal view."
              : "Upload .xlsx or .csv, preview validation, then confirm the import."}
          </p>
        </div>

        <form className="grid gap-4" onSubmit={previewImport}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Excel or CSV file
            <input
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Or paste CSV
            <textarea
              value={importCsv}
              onChange={(event) => setImportCsv(event.target.value)}
              className="min-h-28 rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder={
                "type,amount,currency,category,date,note\nincome,1200,USD,Consulting,2026-05-08,Retainer"
              }
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm text-emerald-700">{successMessage}</div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={previewing}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {previewing ? "Previewing..." : "Preview import"}
              </button>
              <button
                type="button"
                disabled={importing || previewRows.every((row) => row.status !== "ready")}
                onClick={() => void confirmImport()}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {importing ? "Importing..." : "Confirm import"}
              </button>
            </div>
          </div>
        </form>

        {previewRows.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Row", "Status", "Date", "Description", "Amount", "Type", "Balance"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {previewRows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.fingerprint || row.category}`}>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.rowNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                          row.status === "ready"
                            ? "bg-emerald-100 text-emerald-700"
                            : row.status === "duplicate"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.date || "-"}</td>
                    <td className="max-w-xs px-4 py-3 text-sm text-slate-700">
                      <span className="line-clamp-2">
                        {row.errors.length
                          ? row.errors.join(" ")
                          : row.description || row.note || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {formatCurrency(row.amount, row.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-slate-700">{row.type}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {row.balance === null ? "-" : formatCurrency(row.balance, row.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="list" />
            {isPersonalMode ? "Money history" : "Transaction list"}
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            {isPersonalMode
              ? "No money moves yet. Add your first one above."
              : "No transactions yet. Add your first one above."}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {transactions.map((transaction) => {
              const amountColor =
                transaction.type === "income" ? "text-emerald-600" : "text-rose-600";
              const original =
                transaction.originalCurrency &&
                transaction.originalCurrency !== transaction.currency &&
                transaction.originalAmount
                  ? `Original ${formatCurrency(
                      transaction.originalAmount,
                      transaction.originalCurrency,
                    )}`
                  : null;

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
                      {isPersonalMode
                        ? transaction.type === "income"
                          ? "Money In"
                          : "Money Out"
                        : transaction.type}{" "}
                      | {formatDate(transaction.date)}
                      {transaction.note ? ` | ${transaction.note}` : ""}
                    </p>
                    {original ? <p className="mt-1 text-xs text-slate-500">{original}</p> : null}
                  </div>

                  <p className={`text-lg font-semibold ${amountColor}`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount, transaction.currency)}
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
