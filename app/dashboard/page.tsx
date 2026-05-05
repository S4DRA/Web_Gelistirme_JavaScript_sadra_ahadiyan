"use client";

import { useEffect, useState } from "react";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { PageShell } from "@/components/page-shell";

type DashboardData = {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
};

type PredictionData = {
  futureBalance: number;
  sevenDayBalance: number;
  ninetyDayBalance: number;
  dailyNetCashFlow: number;
  risk: boolean;
  daysUntilNegative: number | null;
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
  status: "paid" | "unpaid";
};

type AlertItem = {
  message: string;
  classes: string;
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData>({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
  });
  const [prediction, setPrediction] = useState<PredictionData>({
    futureBalance: 0,
    sevenDayBalance: 0,
    ninetyDayBalance: 0,
    dailyNetCashFlow: 0,
    risk: false,
    daysUntilNegative: null,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setError("");

        const [
          dashboardResponse,
          transactionsResponse,
          predictionResponse,
          invoicesResponse,
        ] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/transactions"),
          fetch("/api/prediction"),
          fetch("/api/invoices"),
        ]);

        if (
          dashboardResponse.status === 401 ||
          transactionsResponse.status === 401 ||
          predictionResponse.status === 401 ||
          invoicesResponse.status === 401
        ) {
          window.location.assign("/login");
          return;
        }

        const dashboardData = await dashboardResponse.json();
        const transactionData = await transactionsResponse.json();
        const predictionData = await predictionResponse.json();
        const invoiceData = await invoicesResponse.json();

        if (!dashboardResponse.ok) {
          throw new Error(dashboardData.error || "Failed to load dashboard.");
        }

        if (!transactionsResponse.ok) {
          throw new Error(transactionData.error || "Failed to load transactions.");
        }

        if (!predictionResponse.ok) {
          throw new Error(predictionData.error || "Failed to load prediction.");
        }

        if (!invoicesResponse.ok) {
          throw new Error(invoiceData.error || "Failed to load invoices.");
        }

        setDashboard(dashboardData);
        setTransactions(transactionData);
        setPrediction(predictionData);
        setInvoices(invoiceData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  async function handleResetData() {
    const confirmed = window.confirm("Are you sure you want to delete all data?");

    if (!confirmed) {
      return;
    }

    setResetting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/reset", {
        method: "DELETE",
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset data.");
      }

      setDashboard({
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
      });
      setPrediction({
        futureBalance: 0,
        sevenDayBalance: 0,
        ninetyDayBalance: 0,
        dailyNetCashFlow: 0,
        risk: false,
        daysUntilNegative: null,
      });
      setTransactions([]);
      setInvoices([]);
      setSuccessMessage("Workspace data was reset successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset data.");
    } finally {
      setResetting(false);
    }
  }

  const cards = [
    {
      label: "Total Income",
      value: formatCurrency(dashboard.totalIncome),
      tone: "text-emerald-600",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(dashboard.totalExpenses),
      tone: "text-rose-600",
    },
    {
      label: "Net Balance",
      value: formatCurrency(dashboard.netBalance),
      tone: "text-slate-900",
    },
  ];

  const unpaidInvoices = invoices.filter((invoice) => invoice.status === "unpaid").length;

  const alerts: AlertItem[] = [
    dashboard.totalExpenses > dashboard.totalIncome
      ? {
          message: "\u26A0\uFE0F Your expenses are higher than your income",
          classes: "border-amber-200 bg-amber-50 text-amber-800",
        }
      : null,
    unpaidInvoices > 3
      ? {
          message: "\u26A0\uFE0F You have multiple unpaid invoices",
          classes: "border-amber-200 bg-amber-50 text-amber-800",
        }
      : null,
    prediction.risk
      ? {
          message: "\uD83D\uDEA8 Cash may run out soon",
          classes: "border-rose-200 bg-rose-50 text-rose-800",
        }
      : null,
  ].filter((alert): alert is AlertItem => alert !== null);

  return (
    <PageShell
      title="Dashboard"
      description="See a quick snapshot of your income, expenses, and recent cash flow."
      actions={
        <button
          type="button"
          disabled={resetting}
          onClick={() => void handleResetData()}
          className="rounded-full border border-rose-300 bg-rose-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resetting ? "Resetting..." : "Reset Data"}
        </button>
      }
    >
      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </section>
      ) : null}

      {successMessage ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {successMessage}
        </section>
      ) : null}

      {!loading && alerts.length > 0 ? (
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
      ) : null}

      <section className="metric-grid grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.label}
            className="metric-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`mt-3 text-3xl font-semibold tracking-tight ${card.tone}`}>
              {loading ? "..." : card.value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4">
        <article
          className={`prediction-card rounded-2xl border p-6 shadow-sm ${
            prediction.risk
              ? "border-rose-200 bg-rose-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              prediction.risk ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            Cash Prediction
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {loading ? "..." : formatCurrency(prediction.futureBalance)}
          </p>
          <p
            className={`mt-3 text-sm font-medium ${
              prediction.risk ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {loading
              ? "Loading prediction..."
              : prediction.risk
                ? `\u26A0\uFE0F You may run out of money in ${prediction.daysUntilNegative ?? 0} days`
                : "\u2705 Your cash flow is stable"}
          </p>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-white/60 p-3">
              <p className="text-slate-500">7 days</p>
              <p className="mt-1 font-semibold text-slate-900">
                {loading ? "..." : formatCurrency(prediction.sevenDayBalance)}
              </p>
            </div>
            <div className="rounded-xl bg-white/60 p-3">
              <p className="text-slate-500">30 days</p>
              <p className="mt-1 font-semibold text-slate-900">
                {loading ? "..." : formatCurrency(prediction.futureBalance)}
              </p>
            </div>
            <div className="rounded-xl bg-white/60 p-3">
              <p className="text-slate-500">90 days</p>
              <p className="mt-1 font-semibold text-slate-900">
                {loading ? "..." : formatCurrency(prediction.ninetyDayBalance)}
              </p>
            </div>
          </div>
        </article>
      </section>

      <CashFlowChart transactions={transactions} />
    </PageShell>
  );
}
