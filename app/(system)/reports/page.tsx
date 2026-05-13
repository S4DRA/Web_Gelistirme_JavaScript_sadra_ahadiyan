"use client";

import { useEffect, useState } from "react";
import { MonthlyTrendChart } from "@/components/analytics-charts";
import { AppIcon } from "@/components/app-icon";
import { useFinanceMode } from "@/components/finance-mode-switcher";
import { PageShell } from "@/components/page-shell";

type ReportSummary = {
  analytics: {
    monthlyTrend: { label: string; income: number; expenses: number; net: number }[];
    recommendations: string[];
  };
  totals: {
    netBalance: number;
    totalExpenses: number;
    totalIncome: number;
  };
  personalSummary?: {
    billSubscriptionSpend: number;
    healthScore: number;
    monthlyIncome: number;
    monthlySpending: number;
    monthlySurvivalCost: number;
  };
  workspace: {
    currency: string;
    financeType: string;
    name: string;
  };
};

export default function ReportsPage() {
  const financeMode = useFinanceMode();
  const isPersonalMode = financeMode === "personal";
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await fetch("/api/reports/summary");

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load report summary.");
        }

        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report summary.");
      } finally {
        setLoading(false);
      }
    }

    function handleFinanceModeChange() {
      setLoading(true);
      void loadSummary();
    }

    window.addEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    void loadSummary();

    return () => {
      window.removeEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    };
  }, []);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      currency: summary?.workspace.currency ?? "USD",
      style: "currency",
    }).format(amount);
  }

  return (
    <PageShell
      title="Reports"
      description={
        isPersonalMode
          ? "Review personal income, spending, balance, and six-month movement."
          : "Export workspace data for accounting, reviews, and monthly reporting."
      }
    >
      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </section>
      ) : null}

      {loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading report summary...
        </section>
      ) : summary ? (
        <>
          <section className="metric-grid grid gap-4 md:grid-cols-3">
            <article className="metric-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Total income</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-700">
                {formatCurrency(summary.totals.totalIncome)}
              </p>
            </article>
            <article className="metric-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Total expenses</p>
              <p className="mt-3 text-3xl font-semibold text-rose-700">
                {formatCurrency(summary.totals.totalExpenses)}
              </p>
            </article>
            <article className="metric-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Net balance</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatCurrency(summary.totals.netBalance)}
              </p>
            </article>
          </section>
          <MonthlyTrendChart
            currency={summary.workspace.currency}
            data={summary.analytics.monthlyTrend}
          />
        </>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="download" />
            Transactions CSV
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Download income and expenses for spreadsheet analysis or accounting.
          </p>
          <a
            href="/api/exports?type=transactions"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Export transactions
          </a>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <AppIcon name="file-invoice" />
            Invoices CSV
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Download due dates, reminder dates, payment status, and invoice amounts.
          </p>
          <a
            href="/api/exports?type=invoices"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Export invoices
          </a>
        </article>
      </section>
    </PageShell>
  );
}
