"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";

type Invoice = {
  id: string;
  clientName: string;
  amount: number;
  currency: string;
  dueDate: string;
  reminderDate: string | null;
  status: "draft" | "sent" | "paid" | "unpaid" | "overdue" | "cancelled";
  originalAmount: number | null;
  originalCurrency: string | null;
};

const currencies = ["USD", "EUR", "TRY", "GBP", "IRR", "AED", "CAD", "AUD", "JPY", "CHF"];

const initialForm = {
  clientName: "",
  amount: "",
  currency: "USD",
  dueDate: "",
  reminderDate: "",
  status: "unpaid",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [workspaceCurrency, setWorkspaceCurrency] = useState("USD");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInvoices() {
      try {
        setError("");

        const [response, currencyResponse] = await Promise.all([
          fetch("/api/invoices"),
          fetch("/api/currency"),
        ]);

        if (response.status === 401 || currencyResponse.status === 401) {
          window.location.assign("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load invoices.");
        }

        setInvoices(data);

        if (currencyResponse.ok) {
          const currencyData = await currencyResponse.json();
          setWorkspaceCurrency(currencyData.baseCurrency);
          setForm((current) => ({ ...current, currency: currencyData.baseCurrency }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    }

    function handleFinanceModeChange() {
      setLoading(true);
      void loadInvoices();
    }

    window.addEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    void loadInvoices();

    return () => {
      window.removeEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName: form.clientName,
          amount: Number(form.amount),
          currency: form.currency,
          dueDate: form.dueDate,
          reminderDate: form.reminderDate || null,
          status: form.status,
        }),
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create invoice.");
      }

      setInvoices((current) =>
        [...current, data].sort(
          (left, right) =>
            new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime(),
        ),
      );
      setForm((current) => ({ ...initialForm, currency: current.currency }));
      setSuccessMessage("Invoice added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  }

  async function markAsPaid(id: string) {
    setUpdatingId(id);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "paid",
        }),
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update invoice.");
      }

      setInvoices((current) =>
        current.map((invoice) => (invoice.id === id ? data : invoice)),
      );
      setSuccessMessage("Invoice marked as paid.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update invoice.");
    } finally {
      setUpdatingId(null);
    }
  }

  function formatCurrency(amount: number, currency = workspaceCurrency) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getInvoiceDisplayStatus(invoice: Invoice) {
    if (invoice.status === "paid") {
      return "Paid";
    }

    if (invoice.status === "draft") {
      return "Draft";
    }

    if (invoice.status === "sent") {
      return "Sent";
    }

    if (invoice.status === "cancelled") {
      return "Cancelled";
    }

    const dueDate = new Date(invoice.dueDate);
    const today = new Date();

    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      return "Late";
    }

    return "Unpaid";
  }

  function getStatusClasses(status: string) {
    if (status === "Paid") {
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    }

    if (status === "Late") {
      return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
    }

    return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  }

  return (
    <PageShell
      title="Invoices"
      description="Add new invoices, review due dates, and mark payments as they come in."
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-slate-900">Add invoice</h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep upcoming client payments easy to track.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Client name
            <input
              required
              maxLength={80}
              type="text"
              value={form.clientName}
              onChange={(event) =>
                setForm((current) => ({ ...current, clientName: event.target.value }))
              }
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Northwind Studio"
            />
          </label>

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
              placeholder="1800.00"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Due date
            <input
              required
              type="date"
              value={form.dueDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, dueDate: event.target.value }))
              }
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
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
            Reminder date
            <input
              type="date"
              value={form.reminderDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, reminderDate: event.target.value }))
              }
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Status
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value }))
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm font-medium">
              <span className="text-emerald-700">{successMessage}</span>
              <span className="text-rose-600">{error}</span>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Saving..." : "Add invoice"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-medium text-slate-900">Invoice list</h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            No invoices yet. Add your first invoice above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reminder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {invoices.map((invoice) => {
                  const displayStatus = getInvoiceDisplayStatus(invoice);
                  const statusClasses = getStatusClasses(displayStatus);

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {invoice.clientName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="font-medium text-slate-900">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </div>
                        {invoice.originalCurrency &&
                        invoice.originalCurrency !== invoice.currency &&
                        invoice.originalAmount ? (
                          <div className="mt-1 text-xs text-slate-500">
                            Original{" "}
                            {formatCurrency(
                              invoice.originalAmount,
                              invoice.originalCurrency,
                            )}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {invoice.reminderDate ? formatDate(invoice.reminderDate) : "None"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusClasses}`}
                        >
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {invoice.status === "paid" ? (
                          <span className="text-slate-400">Paid</span>
                        ) : (
                          <button
                            type="button"
                            disabled={updatingId === invoice.id}
                            onClick={() => markAsPaid(invoice.id)}
                            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingId === invoice.id ? "Updating..." : "Mark as paid"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageShell>
  );
}
