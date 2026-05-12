"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

type CashFlowTransaction = {
  amount: number;
  date: string;
  type: "income" | "expense";
};

type CashFlowChartProps = {
  currency?: string;
  transactions: CashFlowTransaction[];
};

const fallbackChartColors = {
  accent: "#0f766e",
  background: "rgba(15, 118, 110, 0.16)",
  border: "#0f172a",
  muted: "#334155",
  surface: "#ffffff",
  text: "#020617",
};

function readChartColors() {
  if (typeof window === "undefined") {
    return fallbackChartColors;
  }

  const styles = window.getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  const accent = read("--accent", fallbackChartColors.accent);
  const accentFill = /^#[0-9a-f]{6}$/i.test(accent)
    ? `${accent}33`
    : fallbackChartColors.background;

  return {
    accent,
    background: accentFill,
    border: read("--border", fallbackChartColors.border),
    muted: read("--muted", fallbackChartColors.muted),
    surface: read("--surface", fallbackChartColors.surface),
    text: read("--text", fallbackChartColors.text),
  };
}

function useChartColors() {
  const [colors, setColors] = useState(fallbackChartColors);

  useEffect(() => {
    const updateColors = () => setColors(readChartColors());
    const observer = new MutationObserver(updateColors);

    updateColors();
    observer.observe(document.documentElement, {
      attributeFilter: ["data-theme", "data-mode", "data-finance-type"],
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}

function getLastThirtyDays() {
  const days: string[] = [];
  const today = new Date();

  for (let index = 29; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    days.push(date.toISOString().slice(0, 10));
  }

  return days;
}

function formatLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function CashFlowChart({ currency = "USD", transactions }: CashFlowChartProps) {
  const colors = useChartColors();
  const lastThirtyDays = getLastThirtyDays();
  const groupedAmounts = new Map<string, number>();

  for (const day of lastThirtyDays) {
    groupedAmounts.set(day, 0);
  }

  for (const transaction of transactions) {
    const dateKey = transaction.date.slice(0, 10);

    if (!groupedAmounts.has(dateKey)) {
      continue;
    }

    const signedAmount =
      transaction.type === "income" ? transaction.amount : -transaction.amount;

    groupedAmounts.set(dateKey, (groupedAmounts.get(dateKey) ?? 0) + signedAmount);
  }

  const labels = lastThirtyDays.map(formatLabel);
  const values = lastThirtyDays.map((day) => groupedAmounts.get(day) ?? 0);

  const data = {
    labels,
    datasets: [
      {
        label: "Cash flow",
        data: values,
        borderColor: colors.accent,
        backgroundColor: colors.background,
        pointBackgroundColor: colors.surface,
        pointBorderColor: colors.border,
        pointBorderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 4,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 280,
    },
    plugins: {
      legend: {
        display: false,
        labels: { color: colors.text },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: { color: colors.muted },
      },
      y: {
        grid: { color: colors.border },
        ticks: {
          color: colors.muted,
          callback(value) {
            return new Intl.NumberFormat("en-US", {
              currency,
              maximumFractionDigits: 0,
              style: "currency",
            }).format(Number(value));
          },
        },
      },
    },
  };

  return (
    <div className="cash-flow-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-slate-900">Cash flow</h2>
        <p className="mt-1 text-sm text-slate-500">
          Daily net transaction amounts from the last 30 days.
        </p>
      </div>

      <div className="cash-flow-canvas h-72">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
