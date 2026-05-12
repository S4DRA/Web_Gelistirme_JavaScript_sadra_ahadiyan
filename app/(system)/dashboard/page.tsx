"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { CategoryBreakdownChart, InvoiceAgingChart } from "@/components/analytics-charts";
import { AppIcon } from "@/components/app-icon";
import { FinanceModeSwitcher, useFinanceMode } from "@/components/finance-mode-switcher";
import { PageShell } from "@/components/page-shell";

type MetricId =
  | "totalIncome"
  | "totalExpenses"
  | "netBalance"
  | "runway"
  | "overdueInvoices"
  | "dueSoon";
type SectionId =
  | "alerts"
  | "metrics"
  | "prediction"
  | "recommendations"
  | "cashFlow"
  | "analytics";
type PredictionMode = "conservative" | "balanced" | "optimistic";
type PredictionPeriod = 7 | 30 | 90 | 180 | 365;

type DashboardLayout = {
  hiddenCards: MetricId[];
  hiddenSections: SectionId[];
  metricOrder: MetricId[];
  sectionOrder: SectionId[];
};

type PredictionSettings = {
  includePlannedExpenses: boolean;
  includeRecurring: boolean;
  includeUnpaidInvoices: boolean;
  mode: PredictionMode;
  periodDays: PredictionPeriod;
};

type DashboardData = {
  analytics?: {
    categoryBreakdown: { category: string; amount: number; percent: number }[];
    invoiceAging: {
      dueSoon: number;
      overdue: number;
      paid: number;
      unpaid: number;
    };
    recommendations: string[];
    runwayMonths: number | null;
  };
  currency: string;
  dashboardLayout: DashboardLayout;
  predictionSettings: PredictionSettings;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  prediction?: PredictionData;
  transactions?: Transaction[];
  invoices?: Invoice[];
};

type PredictionData = {
  currentBalance: number;
  dailyNetCashFlow: number;
  daysUntilNegative: number | null;
  explanation: string[];
  futureBalance: number;
  mode: PredictionMode;
  periodDays: PredictionPeriod;
  risk: boolean;
  sevenDayBalance: number;
  thirtyDayBalance: number;
  ninetyDayBalance: number;
};

type Transaction = {
  id: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  category: string;
};

type Invoice = {
  id: string;
  status: "paid" | "unpaid" | "sent" | "overdue" | "draft" | "cancelled";
};

type AlertItem = {
  message: string;
  classes: string;
};

const defaultLayout: DashboardLayout = {
  hiddenCards: [],
  hiddenSections: [],
  metricOrder: [
    "totalIncome",
    "totalExpenses",
    "netBalance",
    "runway",
    "overdueInvoices",
    "dueSoon",
  ],
  sectionOrder: [
    "alerts",
    "metrics",
    "prediction",
    "recommendations",
    "cashFlow",
    "analytics",
  ],
};

const defaultPredictionSettings: PredictionSettings = {
  includePlannedExpenses: true,
  includeRecurring: true,
  includeUnpaidInvoices: true,
  mode: "balanced",
  periodDays: 30,
};

const metricLabels: Record<MetricId, string> = {
  dueSoon: "Due soon",
  netBalance: "Net Balance",
  overdueInvoices: "Overdue invoices",
  runway: "Runway",
  totalExpenses: "Total Expenses",
  totalIncome: "Total Income",
};

const sectionLabels: Record<SectionId, string> = {
  alerts: "Alerts",
  analytics: "Analytics",
  cashFlow: "Cash flow",
  metrics: "Financial widgets",
  prediction: "Prediction",
  recommendations: "Next actions",
};

const personalMetricLabels: Record<MetricId, string> = {
  dueSoon: "Bills & Subscriptions",
  netBalance: "Personal Balance",
  overdueInvoices: "Savings Progress",
  runway: "Daily Burn Rate",
  totalExpenses: "Monthly Spending",
  totalIncome: "Money In",
};

const personalSections = {
  gentleNotes: "Gentle money notes",
  healthScore: "Financial Health Score",
  monthlySurvival: "Monthly Survival Cost",
  savingsProgress: "Savings Progress",
};

const essentialCategories = new Set([
  "groceries",
  "rent",
  "utilities",
  "internet",
  "phone bills",
  "transportation",
  "fuel",
  "healthcare",
  "insurance",
  "education",
  "subscriptions",
]);

function isSameMonth(date: string, now: Date) {
  const value = new Date(date);

  return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth();
}

export default function DashboardPage() {
  const financeMode = useFinanceMode();
  const isPersonalMode = financeMode === "personal";
  const [dashboard, setDashboard] = useState<DashboardData>({
    currency: "USD",
    dashboardLayout: defaultLayout,
    netBalance: 0,
    predictionSettings: defaultPredictionSettings,
    totalExpenses: 0,
    totalIncome: 0,
  });
  const [layout, setLayout] = useState<DashboardLayout>(defaultLayout);
  const [prediction, setPrediction] = useState<PredictionData>({
    currentBalance: 0,
    dailyNetCashFlow: 0,
    daysUntilNegative: null,
    explanation: [],
    futureBalance: 0,
    mode: "balanced",
    periodDays: 30,
    risk: false,
    sevenDayBalance: 0,
    thirtyDayBalance: 0,
    ninetyDayBalance: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingLayout, setSavingLayout] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPrediction(settings: PredictionSettings) {
    const params = new URLSearchParams({
      includePlannedExpenses: String(settings.includePlannedExpenses),
      includeRecurring: String(settings.includeRecurring),
      includeUnpaidInvoices: String(settings.includeUnpaidInvoices),
      mode: settings.mode,
      periodDays: String(settings.periodDays),
    });
    const predictionResponse = await fetch(`/api/prediction?${params.toString()}`);

    if (predictionResponse.status === 401) {
      window.location.assign("/login");
      return;
    }

    const predictionData = await predictionResponse.json();

    if (!predictionResponse.ok) {
      throw new Error(predictionData.error || "Failed to load prediction.");
    }

    setPrediction(predictionData);
  }

  useEffect(() => {
    async function loadDashboard() {
      try {
        setError("");

        const dashboardResponse = await fetch("/api/dashboard");

        if (dashboardResponse.status === 401) {
          window.location.assign("/login");
          return;
        }

        const dashboardData = await dashboardResponse.json();

        if (!dashboardResponse.ok) {
          throw new Error(dashboardData.error || "Failed to load dashboard.");
        }

        setDashboard(dashboardData);
        setLayout(dashboardData.dashboardLayout ?? defaultLayout);
        setTransactions(dashboardData.transactions ?? []);
        setInvoices(dashboardData.invoices ?? []);

        if (dashboardData.prediction) {
          setPrediction(dashboardData.prediction);
        } else {
          await loadPrediction(dashboardData.predictionSettings ?? defaultPredictionSettings);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    function handleFinanceModeChange() {
      setLoading(true);
      void loadDashboard();
    }

    window.addEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    void loadDashboard();

    return () => {
      window.removeEventListener("dampener-finance-mode-changed", handleFinanceModeChange);
    };
  }, []);

  async function saveLayout(nextLayout = layout) {
    setSavingLayout(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/dashboard/layout", {
        body: JSON.stringify({ dashboardLayout: nextLayout }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save dashboard layout.");
      }

      setLayout(data.dashboardLayout);
      setMessage("Dashboard layout saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save dashboard layout.");
    } finally {
      setSavingLayout(false);
    }
  }

  async function resetLayout() {
    setSavingLayout(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/dashboard/layout", { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset dashboard layout.");
      }

      setLayout(data.dashboardLayout);
      setMessage("Dashboard layout reset.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset dashboard layout.");
    } finally {
      setSavingLayout(false);
    }
  }

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-US", {
      currency: dashboard.currency,
      maximumFractionDigits: 2,
      style: "currency",
    }).format(amount);
  }, [dashboard.currency]);

  function moveItem<T extends string>(items: T[], item: T, direction: -1 | 1) {
    const index = items.indexOf(item);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= items.length) {
      return items;
    }

    const nextItems = [...items];
    const [removed] = nextItems.splice(index, 1);
    nextItems.splice(nextIndex, 0, removed);
    return nextItems;
  }

  const personalSummary = useMemo(() => {
    const now = new Date();
    const monthlyTransactions = transactions.filter((transaction) =>
      isSameMonth(transaction.date, now),
    );
    const monthlyIncome = monthlyTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);
    const monthlySpending = monthlyTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);
    const monthlySurvivalCost = monthlyTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          essentialCategories.has(transaction.category.trim().toLowerCase()),
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
    const subscriptionSpend = monthlyTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category.trim().toLowerCase() === "subscriptions",
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
    const dailyBurnRate = monthlySpending / Math.max(1, now.getDate());
    const savingsTarget = Math.max(5000, monthlySurvivalCost * 3);
    const savingsProgress = Math.min(
      100,
      Math.max(0, (dashboard.netBalance / savingsTarget) * 100),
    );
    const savingsRate =
      monthlyIncome > 0 ? Math.max(0, (monthlyIncome - monthlySpending) / monthlyIncome) : 0;
    const spendBalance = monthlyIncome > 0 ? Math.max(0, 1 - monthlySpending / monthlyIncome) : 0;
    const healthScore = Math.round(
      Math.min(100, Math.max(0, savingsRate * 45 + spendBalance * 35 + savingsProgress * 0.2)),
    );

    return {
      dailyBurnRate,
      healthScore,
      monthlyIncome,
      monthlySpending,
      monthlySurvivalCost,
      savingsProgress,
      subscriptionSpend,
    };
  }, [dashboard.netBalance, transactions]);

  const activeMetricLabels = isPersonalMode ? personalMetricLabels : metricLabels;

  const cards = useMemo(
    () => ({
      dueSoon: {
        icon: "bell",
        label: activeMetricLabels.dueSoon,
        tone: "text-amber-700",
        value: isPersonalMode
          ? formatCurrency(personalSummary.subscriptionSpend)
          : formatCurrency(dashboard.analytics?.invoiceAging.dueSoon ?? 0),
      },
      netBalance: {
        icon: "wallet",
        label: activeMetricLabels.netBalance,
        tone: "text-slate-900",
        value: formatCurrency(dashboard.netBalance),
      },
      overdueInvoices: {
        icon: isPersonalMode ? "bullseye-arrow" : "receipt",
        label: activeMetricLabels.overdueInvoices,
        tone: isPersonalMode ? "text-emerald-700" : "text-rose-600",
        value: isPersonalMode
          ? `${Math.round(personalSummary.savingsProgress)}%`
          : formatCurrency(dashboard.analytics?.invoiceAging.overdue ?? 0),
      },
      runway: {
        icon: "calendar-clock",
        label: activeMetricLabels.runway,
        tone: "text-blue-700",
        value: isPersonalMode
          ? formatCurrency(personalSummary.dailyBurnRate)
          : dashboard.analytics?.runwayMonths === null ||
              dashboard.analytics?.runwayMonths === undefined
            ? "Not set"
            : `${dashboard.analytics.runwayMonths} months`,
      },
      totalExpenses: {
        icon: "arrow-trend-down",
        label: activeMetricLabels.totalExpenses,
        tone: "text-rose-600",
        value: formatCurrency(
          isPersonalMode ? personalSummary.monthlySpending : dashboard.totalExpenses,
        ),
      },
      totalIncome: {
        icon: "arrow-trend-up",
        label: activeMetricLabels.totalIncome,
        tone: "text-emerald-600",
        value: formatCurrency(
          isPersonalMode ? personalSummary.monthlyIncome : dashboard.totalIncome,
        ),
      },
    }),
    [activeMetricLabels, dashboard, formatCurrency, isPersonalMode, personalSummary],
  );

  const unpaidInvoices = invoices.filter((invoice) =>
    ["unpaid", "sent", "overdue"].includes(invoice.status),
  ).length;
  const alerts: AlertItem[] = [
    dashboard.totalExpenses > dashboard.totalIncome
      ? {
          classes: "border-amber-200 bg-amber-50 text-amber-800",
          message: isPersonalMode
            ? "Your spending is higher than your money in this month"
            : "Your expenses are higher than your income",
        }
      : null,
    !isPersonalMode && unpaidInvoices > 3
      ? {
          classes: "border-amber-200 bg-amber-50 text-amber-800",
          message: "You have multiple unpaid invoices",
        }
      : null,
    prediction.risk
      ? {
          classes: "border-rose-200 bg-rose-50 text-rose-800",
          message: isPersonalMode ? "Your money may get tight soon" : "Cash may run out soon",
        }
      : null,
  ].filter((alert): alert is AlertItem => alert !== null);
  const predictionDelta = prediction.futureBalance - prediction.currentBalance;
  const predictionTone = prediction.risk
      ? {
          icon: "triangle-warning",
          label: "Needs attention",
          text: isPersonalMode
            ? "Your money may drop below zero in this view."
            : "Projected cash falls below zero in this horizon.",
        }
      : predictionDelta < 0
        ? {
            icon: "arrow-trend-down",
            label: isPersonalMode ? "Spending faster" : "Cash tightening",
            text: isPersonalMode
              ? "Your balance is likely to go down, but stay above zero."
              : "Cash is projected to decrease, but remain above zero.",
          }
        : {
            icon: "shield-check",
            label: isPersonalMode ? "Looking steady" : "Stable outlook",
            text: isPersonalMode
              ? "Your balance looks steady for this time window."
              : "Cash is projected to stay steady for the selected horizon.",
          };

  const sectionRenderers: Record<SectionId, ReactNode> = {
    alerts:
      alerts.length > 0 ? (
        <section className="grid gap-3">
          {alerts.map((alert) => (
            <article
              key={alert.message}
              className={`alert-card rounded-2xl border p-4 text-sm font-medium shadow-sm ${alert.classes}`}
            >
              {alert.message}
            </article>
          ))}
        </section>
      ) : null,
    analytics: dashboard.analytics ? (
      isPersonalMode ? (
        <section className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-slate-900">
                  {personalSections.healthScore}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  A calm read on savings, spending, and stability.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-2xl font-semibold text-emerald-700">
                {personalSummary.healthScore}
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${personalSummary.healthScore}%` }}
              />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{personalSections.monthlySurvival}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatCurrency(personalSummary.monthlySurvivalCost)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{personalSections.savingsProgress}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {Math.round(personalSummary.savingsProgress)}%
                </p>
              </div>
            </div>
          </article>
          <CategoryBreakdownChart
            currency={dashboard.currency}
            data={dashboard.analytics.categoryBreakdown}
          />
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          <CategoryBreakdownChart
            currency={dashboard.currency}
            data={dashboard.analytics.categoryBreakdown}
          />
          <InvoiceAgingChart
            currency={dashboard.currency}
            data={dashboard.analytics.invoiceAging}
          />
        </section>
      )
    ) : null,
    cashFlow: <CashFlowChart currency={dashboard.currency} transactions={transactions} />,
    metrics: (
      <section className="metric-grid grid gap-4 md:grid-cols-3">
        {layout.metricOrder
          .filter((cardId) => !layout.hiddenCards.includes(cardId))
          .map((cardId) => {
            const card = cards[cardId];

            return (
              <article
                key={card.label}
                className="metric-card overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <p className="min-w-0 break-words text-sm text-slate-500">
                    {card.label}
                  </p>
                  <span className="icon-badge shrink-0">
                    <AppIcon name={card.icon} className="text-lg" />
                  </span>
                </div>
                <p className={`mt-3 text-3xl font-semibold tracking-tight ${card.tone}`}>
                  {loading ? "..." : card.value}
                </p>
              </article>
            );
          })}
      </section>
    ),
    prediction: (
      <section className="grid gap-4">
        <article
          className={`prediction-card rounded-2xl border p-6 shadow-sm ${
            prediction.risk
              ? "forecast-risk border-rose-200 bg-rose-50"
              : "forecast-stable border-emerald-200 bg-emerald-50"
          }`}
        >
          <div className="grid gap-5 lg:grid-cols-[1.05fr_1.4fr] lg:items-stretch">
            <div className="flex flex-col justify-between gap-5">
              <div className="forecast-summary">
                <span className="icon-badge forecast-icon">
                  <AppIcon name={predictionTone.icon} className="text-lg" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {isPersonalMode ? "Money outlook" : "Cash outlook"}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {loading ? "..." : formatCurrency(prediction.futureBalance)}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {loading
                      ? "Loading forecast..."
                      : `${predictionTone.label} - ${prediction.periodDays} days - ${prediction.mode}`}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {predictionTone.text}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {isPersonalMode ? "Expected balance change: " : "Expected change from today: "}
                  <span
                    className={
                      predictionDelta < 0
                        ? "font-semibold text-rose-700"
                        : "font-semibold text-emerald-700"
                    }
                  >
                    {loading ? "..." : formatCurrency(predictionDelta)}
                  </span>
                  {prediction.risk && prediction.daysUntilNegative !== null
                    ? `, with a possible negative balance in ${prediction.daysUntilNegative} days.`
                    : "."}
                </p>
              </div>
            </div>

            <div className="forecast-metrics">
              {[
                ["7 days", prediction.sevenDayBalance],
                ["30 days", prediction.thirtyDayBalance],
                ["90 days", prediction.ninetyDayBalance],
              ].map(([label, value]) => (
                <div key={label} className="forecast-mini-card">
                  <p>{label}</p>
                  <p>{loading ? "..." : formatCurrency(value as number)}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    ),
    recommendations: dashboard.analytics?.recommendations.length ? (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-slate-900">
            {isPersonalMode ? personalSections.gentleNotes : "Next best actions"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPersonalMode
              ? "Simple notes about spending, bills, and small savings chances."
              : "Signals worth checking before you add more data."}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {dashboard.analytics.recommendations.map((recommendation) => (
            <div
              key={recommendation}
              className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700"
            >
              <AppIcon name="lightbulb-on" className="mt-0.5 text-base text-amber-700" />
              {recommendation}
            </div>
          ))}
        </div>
      </section>
    ) : null,
  };

  return (
    <PageShell
      title={isPersonalMode ? "Personal Money" : "Dashboard"}
      description={
        isPersonalMode
          ? "A simple view of balance, spending, bills, savings, and daily money habits."
          : "See a quick snapshot of your income, expenses, and recent cash flow."
      }
      unifiedSurface
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <div className="dashboard-actions-finance-switcher hidden sm:block">
            <FinanceModeSwitcher />
          </div>
          <button
            type="button"
            onClick={() => setCustomizing((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
          >
            <AppIcon name="settings-sliders" />
            Customize
          </button>
        </div>
      }
    >
      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </section>
      ) : null}

      {message ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {message}
        </section>
      ) : null}

      {customizing ? (
        <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:grid-cols-2">
          <div>
            <h2 className="text-lg font-medium text-slate-900">Dashboard cards</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pick which financial widgets appear first and which stay hidden.
            </p>
            <div className="mt-4 grid gap-2">
              {layout.metricOrder.map((cardId, index) => (
                <div
                  key={cardId}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={!layout.hiddenCards.includes(cardId)}
                      onChange={(event) =>
                        setLayout((current) => ({
                          ...current,
                          hiddenCards: event.target.checked
                            ? current.hiddenCards.filter((item) => item !== cardId)
                            : [...current.hiddenCards, cardId],
                        }))
                      }
                      className="h-4 w-4"
                    />
                    {activeMetricLabels[cardId]}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        setLayout((current) => ({
                          ...current,
                          metricOrder: moveItem(current.metricOrder, cardId, -1),
                        }))
                      }
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      disabled={index === layout.metricOrder.length - 1}
                      onClick={() =>
                        setLayout((current) => ({
                          ...current,
                          metricOrder: moveItem(current.metricOrder, cardId, 1),
                        }))
                      }
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40"
                    >
                      Down
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-slate-900">Dashboard sections</h2>
            <p className="mt-1 text-sm text-slate-500">
              Reorder the main dashboard flow or hide sections you do not use.
            </p>
            <div className="mt-4 grid gap-2">
              {layout.sectionOrder.map((sectionId, index) => (
                <div
                  key={sectionId}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={!layout.hiddenSections.includes(sectionId)}
                      onChange={(event) =>
                        setLayout((current) => ({
                          ...current,
                          hiddenSections: event.target.checked
                            ? current.hiddenSections.filter((item) => item !== sectionId)
                            : [...current.hiddenSections, sectionId],
                        }))
                      }
                      className="h-4 w-4"
                    />
                    {sectionLabels[sectionId]}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        setLayout((current) => ({
                          ...current,
                          sectionOrder: moveItem(current.sectionOrder, sectionId, -1),
                        }))
                      }
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      disabled={index === layout.sectionOrder.length - 1}
                      onClick={() =>
                        setLayout((current) => ({
                          ...current,
                          sectionOrder: moveItem(current.sectionOrder, sectionId, 1),
                        }))
                      }
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40"
                    >
                      Down
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={savingLayout}
                onClick={() => void resetLayout()}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:opacity-60"
              >
                Reset default
              </button>
              <button
                type="button"
                disabled={savingLayout}
                onClick={() => void saveLayout()}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                {savingLayout ? "Saving..." : "Save layout"}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {layout.sectionOrder
        .filter((sectionId) => !layout.hiddenSections.includes(sectionId))
        .map((sectionId) => (
          <div key={sectionId}>{sectionRenderers[sectionId]}</div>
        ))}
    </PageShell>
  );
}
