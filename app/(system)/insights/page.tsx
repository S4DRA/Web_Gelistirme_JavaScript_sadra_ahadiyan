"use client";

import { useEffect, useState } from "react";
import {
  CategoryBreakdownChart,
  InvoiceAgingChart,
  MonthlyTrendChart,
} from "@/components/analytics-charts";
import { AppIcon } from "@/components/app-icon";
import { useFinanceMode } from "@/components/finance-mode-switcher";
import { PageShell } from "@/components/page-shell";

type Insights = {
  categoryBreakdown: { category: string; amount: number; percent: number }[];
  currentIncome: number;
  currentExpenses: number;
  expenseChangePercent: number | null;
  incomeChangePercent: number | null;
  invoiceAging: {
    dueSoon: number;
    overdue: number;
    paid: number;
    unpaid: number;
  };
  monthlyTrend: { label: string; income: number; expenses: number; net: number }[];
  recommendations: string[];
  runwayMonths: number | null;
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
  const financeMode = useFinanceMode();
  const isPersonalMode = financeMode === "personal";
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

    function handleFinanceModeChange() {
      setLoading(true);
      void loadInsights();
    }

    window.addEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    void loadInsights();

    return () => {
      window.removeEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    };
  }, []);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  }

  return (
    <PageShell
      title={isPersonalMode ? "Money Insights" : "Insights"}
      description={
        isPersonalMode
          ? "Simple notes about spending, bills, savings, and how long your money may last."
          : "Automatic signals for cash runway, spend movement, invoices, and budgets."
      }
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
              <p className="text-sm text-slate-500">
                {isPersonalMode ? "Money in 7 days" : "7 day forecast"}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatCurrency(insights.prediction.sevenDayBalance)}
              </p>
            </article>
            <article className="metric-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                {isPersonalMode ? "Money in 30 days" : "30 day forecast"}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatCurrency(insights.prediction.futureBalance)}
              </p>
            </article>
            <article className="metric-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                {isPersonalMode ? "Monthly survival view" : "Runway from fixed costs"}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {insights.runwayMonths === null ? "Not set" : `${insights.runwayMonths} mo`}
              </p>
            </article>
          </section>

          {insights.recommendations.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-slate-900">
                {isPersonalMode ? "Gentle money notes" : "Action queue"}
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {insights.recommendations.map((recommendation) => (
                  <div
                    key={recommendation}
                    className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700"
                  >
                    <AppIcon name="sparkles" className="mt-0.5 text-base text-amber-700" />
                    {recommendation}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-4">
            <MonthlyTrendChart data={insights.monthlyTrend} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <CategoryBreakdownChart data={insights.categoryBreakdown} />
            {isPersonalMode ? (
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
                  <AppIcon name="shield-check" />
                  Financial Health Score
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Built from your current balance, spending pace, income stability, and budget
                  pressure.
                </p>
                <p className="mt-5 text-4xl font-semibold text-emerald-700">
                  {Math.round(
                    Math.min(
                      100,
                      Math.max(
                        0,
                        (insights.currentIncome > insights.currentExpenses ? 50 : 25) +
                          (insights.budgetWarnings.length === 0 ? 25 : 8) +
                          (insights.prediction.daysUntilNegative === null ? 25 : 5),
                      ),
                    ),
                  )}
                </p>
              </article>
            ) : (
              <InvoiceAgingChart data={insights.invoiceAging} />
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
                <AppIcon name="arrow-trend-up" />
                {isPersonalMode ? "Money In" : "Income movement"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {insights.incomeChangePercent === null
                  ? "There is not enough previous month income data yet."
                  : isPersonalMode
                    ? `Money in changed ${insights.incomeChangePercent}% compared with last month.`
                    : `Income changed ${insights.incomeChangePercent}% compared with last month.`}
              </p>
              <p className="mt-4 text-2xl font-semibold text-emerald-700">
                {formatCurrency(insights.currentIncome)}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                {isPersonalMode ? "Money in 90 days" : "90 day forecast"}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatCurrency(insights.prediction.ninetyDayBalance)}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
                <AppIcon name="arrow-trend-down" />
                {isPersonalMode ? "Spending" : "Spend movement"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {insights.expenseChangePercent === null
                  ? "There is not enough previous month data yet."
                  : isPersonalMode
                    ? `Spending changed ${insights.expenseChangePercent}% compared with last month.`
                    : `Expenses changed ${insights.expenseChangePercent}% compared with last month.`}
              </p>
              <p className="mt-4 text-2xl font-semibold text-slate-900">
                {formatCurrency(insights.currentExpenses)}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
                <AppIcon name="bullseye-arrow" />
                {isPersonalMode ? "Biggest spending area" : "Top pressure point"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {insights.topCategory
                  ? `${insights.topCategory.category} is your biggest expense category this month.`
                  : isPersonalMode
                    ? "No spending category stands out yet."
                    : "No expense category stands out yet."}
              </p>
              <p className="mt-4 text-2xl font-semibold text-slate-900">
                {insights.topCategory ? formatCurrency(insights.topCategory.amount) : "$0.00"}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
                <AppIcon name="triangle-warning" />
                {isPersonalMode ? "Budget nudges" : "Budget warnings"}
              </h2>
              {insights.budgetWarnings.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  {isPersonalMode
                    ? "No spending plan is close to its limit this month."
                    : "No budget is over 80% this month."}
                </p>
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
