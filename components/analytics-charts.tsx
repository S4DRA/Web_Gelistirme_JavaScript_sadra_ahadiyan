"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

type MonthlyTrendItem = {
  label: string;
  income: number;
  expenses: number;
  net: number;
};

type CategoryItem = {
  category: string;
  amount: number;
  percent: number;
};

type InvoiceAging = {
  paid: number;
  unpaid: number;
  overdue: number;
  dueSoon: number;
};

const fallbackChartColors = {
  accent: "#0f766e",
  background: "#ffffff",
  border: "#0f172a",
  danger: "#be123c",
  muted: "#334155",
  primary: "#0f172a",
  text: "#020617",
  warning: "#78350f",
};

function readChartColors() {
  if (typeof window === "undefined") {
    return fallbackChartColors;
  }

  const styles = window.getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;

  return {
    accent: read("--accent", fallbackChartColors.accent),
    background: read("--surface", fallbackChartColors.background),
    border: read("--border", fallbackChartColors.border),
    danger: read("--danger", fallbackChartColors.danger),
    muted: read("--muted", fallbackChartColors.muted),
    primary: read("--primary", fallbackChartColors.primary),
    text: read("--text", fallbackChartColors.text),
    warning: read("--warning-text", fallbackChartColors.warning),
  };
}

function useChartColors() {
  const [colors, setColors] = useState(fallbackChartColors);

  useEffect(() => {
    const updateColors = () => setColors(readChartColors());
    const observer = new MutationObserver(updateColors);

    updateColors();
    observer.observe(document.documentElement, {
      attributeFilter: ["data-theme", "data-mode", "data-contrast", "data-finance-type"],
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}

function moneyTick(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value));
}

export function MonthlyTrendChart({
  currency = "USD",
  data,
}: {
  currency?: string;
  data: MonthlyTrendItem[];
}) {
  const colors = useChartColors();
  const options: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    responsive: true,
    animation: {
      duration: 280,
    },
    plugins: {
      legend: { labels: { color: colors.text }, position: "bottom" },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: colors.muted } },
      y: {
        grid: { color: colors.border },
        ticks: {
          color: colors.muted,
          callback(value) {
            return moneyTick(value, currency);
          },
        },
      },
    },
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-slate-900">Six month movement</h2>
        <p className="mt-1 text-sm text-slate-500">Income and expense trend by month.</p>
      </div>
      <div className="h-80">
        <Bar
          data={{
            labels: data.map((item) => item.label),
            datasets: [
              {
                backgroundColor: colors.accent,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 6,
                data: data.map((item) => item.income),
                label: "Income",
              },
              {
                backgroundColor: colors.danger,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 6,
                data: data.map((item) => item.expenses),
                label: "Expenses",
              },
            ],
          }}
          options={options}
        />
      </div>
    </article>
  );
}

export function CategoryBreakdownChart({
  data,
}: {
  currency?: string;
  data: CategoryItem[];
}) {
  const colors = useChartColors();
  const visibleData = data.slice(0, 6);
  const palette = [
    colors.accent,
    colors.danger,
    colors.warning,
    colors.primary,
    colors.text,
    colors.muted,
  ];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-slate-900">Category pressure</h2>
        <p className="mt-1 text-sm text-slate-500">Largest expense categories this month.</p>
      </div>
      {visibleData.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm text-slate-500">
          Add expenses to see category pressure.
        </div>
      ) : (
        <div className="h-72">
          <Doughnut
            data={{
              labels: visibleData.map((item) => item.category),
              datasets: [
                {
                  backgroundColor: palette,
                  borderColor: colors.background,
                  borderWidth: 3,
                  data: visibleData.map((item) => item.amount),
                },
              ],
            }}
            options={{
              animation: {
                duration: 280,
              },
              maintainAspectRatio: false,
              plugins: {
                legend: { labels: { color: colors.text }, position: "bottom" },
              },
              responsive: true,
            }}
          />
        </div>
      )}
    </article>
  );
}

export function InvoiceAgingChart({
  currency = "USD",
  data,
}: {
  currency?: string;
  data: InvoiceAging;
}) {
  const colors = useChartColors();
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-slate-900">Invoice pipeline</h2>
        <p className="mt-1 text-sm text-slate-500">Paid, open, overdue, and due-soon value.</p>
      </div>
      <div className="h-72">
        <Bar
          data={{
            labels: ["Paid", "Open", "Overdue", "Due soon"],
            datasets: [
              {
                backgroundColor: [colors.accent, colors.primary, colors.danger, colors.warning],
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 6,
                data: [data.paid, data.unpaid, data.overdue, data.dueSoon],
                label: "Amount",
              },
            ],
          }}
          options={{
            animation: {
              duration: 280,
            },
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            responsive: true,
            scales: {
              x: { grid: { display: false }, ticks: { color: colors.muted } },
              y: {
                grid: { color: colors.border },
                ticks: {
                  color: colors.muted,
                  callback(value) {
                    return moneyTick(value, currency);
                  },
                },
              },
            },
          }}
        />
      </div>
    </article>
  );
}
