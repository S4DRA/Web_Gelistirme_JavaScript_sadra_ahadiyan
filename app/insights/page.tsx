"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";

type Insights = {
  currentIncome: number;
  currentExpenses: number;
  expenseChangePercent: number | null;
  topCategory: { category: string; amount: number } | null;
  overdueInvoices: number;
  overdueAmount: number;
  budgetWarnings: { category: string; spent: number; limit: number; percent: number }[];
  prediction: {
    sevenDayBalance: number;
    futureBalance: number;
    ninetyDayBalance: number;
    daysUntilNegative: number | null;
    dailyNetCashFlow: number;
  };
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInsights() {
      try {
        const response = await fetch("/api/insights");

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load insights.");
        }

        setInsights(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load insights.");
      } finally {
        setLoading(false);
      }
    }

    void loadInsights();
  }, []);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  }

  return (
    <PageShell
      title="Insights"
      description="Automatic signals for cash runway, spend movement, invoices, and budgets."
    >
      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </section>
      ) : null}

      {loading || !insights ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading insights...
        </section>
      ) : (
        <>
          <section className="metric-grid grid gap-4">
            <article className="metric-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">7 day forecast</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatCurrency(insights.prediction.sevenDayBalance)}
              </p>
            </article>
            <article className="metric-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">30 day forecast</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatCurrency(insights.prediction.futureBalance)}
              </p>
            </article>
            <article className="metric-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">90 day forecast</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatCurrency(insights.prediction.ninetyDayBalance)}
              </p>
            </article>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-slate-900">Spend movement</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {insights.expenseChangePercent === null
                  ? "There is not enough previous month data yet."
                  : `Expenses changed ${insights.expenseChangePercent}% compared with last month.`}
              </p>
              <p className="mt-4 text-2xl font-semibold text-slate-900">
                {formatCurrency(insights.currentExpenses)}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-slate-900">Top pressure point</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {insights.topCategory
                  ? `${insights.topCategory.category} is your biggest expense category this month.`
                  : "No expense category stands out yet."}
              </p>
              <p className="mt-4 text-2xl font-semibold text-slate-900">
                {insights.topCategory ? formatCurrency(insights.topCategory.amount) : "$0.00"}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-slate-900">Invoice risk</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {insights.overdueInvoices} overdue invoices worth {formatCurrency(insights.overdueAmount)}.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-slate-900">Budget warnings</h2>
              {insights.budgetWarnings.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No budget is over 80% this month.</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {insights.budgetWarnings.map((budget) => (
                    <div key={budget.category}>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>{budget.category}</span>
                        <span>{budget.percent}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-rose-600"
                          style={{ width: `${Math.min(100, budget.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </PageShell>
  );
}
