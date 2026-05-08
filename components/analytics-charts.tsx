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

const palette = ["#0f766e", "#be123c", "#7c3aed", "#ca8a04", "#2563eb", "#475569"];

function moneyTick(value: string | number) {
  return `$${Number(value).toLocaleString("en-US")}`;
}

export function MonthlyTrendChart({ data }: { data: MonthlyTrendItem[] }) {
  const options: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        ticks: {
          callback: moneyTick,
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
                backgroundColor: "#0f766e",
                borderRadius: 6,
                data: data.map((item) => item.income),
                label: "Income",
              },
              {
                backgroundColor: "#be123c",
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

export function CategoryBreakdownChart({ data }: { data: CategoryItem[] }) {
  const visibleData = data.slice(0, 6);

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
                  borderColor: "#ffffff",
                  borderWidth: 3,
                  data: visibleData.map((item) => item.amount),
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "bottom" },
              },
              responsive: true,
            }}
          />
        </div>
      )}
    </article>
  );
}

export function InvoiceAgingChart({ data }: { data: InvoiceAging }) {
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
                backgroundColor: ["#0f766e", "#2563eb", "#be123c", "#ca8a04"],
                borderRadius: 6,
                data: [data.paid, data.unpaid, data.overdue, data.dueSoon],
                label: "Amount",
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            responsive: true,
            scales: {
              x: { grid: { display: false } },
              y: { ticks: { callback: moneyTick } },
            },
          }}
        />
      </div>
    </article>
  );
}
