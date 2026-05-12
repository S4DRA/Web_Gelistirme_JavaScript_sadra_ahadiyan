"use client";

import { FormEvent, useMemo, useState } from "react";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { CategoryBreakdownChart, InvoiceAgingChart } from "@/components/analytics-charts";
import { AppIcon } from "@/components/app-icon";

type Transaction = {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  type: "income" | "expense";
};

const navItems = [
  { icon: "apps", label: "Dashboard" },
  { icon: "building", label: "Workspaces" },
  { icon: "analyse", label: "Insights" },
  { icon: "wallet", label: "Transactions" },
  { icon: "calculator-money", label: "Budgets" },
  { icon: "file-invoice", label: "Invoices" },
  { icon: "document", label: "Reports" },
  { icon: "settings", label: "Settings" },
];

const metrics = [
  { icon: "arrow-trend-up", label: "Total Income", tone: "text-emerald-600", value: "$48,920" },
  { icon: "arrow-trend-down", label: "Total Expenses", tone: "text-rose-600", value: "$31,480" },
  { icon: "wallet", label: "Net Balance", tone: "text-slate-900", value: "$17,440" },
  { icon: "calendar-clock", label: "Runway", tone: "text-blue-700", value: "5.8 months" },
  { icon: "receipt", label: "Overdue invoices", tone: "text-rose-600", value: "$3,820" },
  { icon: "bell", label: "Due soon", tone: "text-amber-700", value: "$6,450" },
];

const recommendations = [
  "Follow up on Atlas Studio before Friday to reduce invoice exposure.",
  "Marketing spend is 18% above the balanced forecast for this period.",
  "The next payroll cycle is covered if two open invoices clear this week.",
  "Keep recurring software renewals in the current forecast window.",
];

const invoiceRows = [
  ["Atlas Studio", "INV-1048", "$3,820", "Overdue", "text-rose-700 bg-rose-50"],
  ["Northline Labs", "INV-1051", "$4,900", "Sent", "text-blue-700 bg-blue-50"],
  ["Bright Works", "INV-1055", "$1,550", "Due soon", "text-amber-700 bg-amber-50"],
  ["Mercury Ops", "INV-1057", "$7,240", "Paid", "text-emerald-700 bg-emerald-50"],
];

const categoryBreakdown = [
  { amount: 9200, category: "Payroll", percent: 29 },
  { amount: 6100, category: "Contractors", percent: 19 },
  { amount: 4800, category: "Software", percent: 15 },
  { amount: 3900, category: "Marketing", percent: 12 },
  { amount: 2800, category: "Office", percent: 9 },
  { amount: 1900, category: "Travel", percent: 6 },
];

function buildTransactions(): Transaction[] {
  const items = [
    ["Client retainer", 12400, "income", "Revenue", 2],
    ["Product sprint", 8600, "income", "Revenue", 6],
    ["Cloud services", 1840, "expense", "Software", 8],
    ["Payroll cycle", 14200, "expense", "Payroll", 11],
    ["Consulting deposit", 7100, "income", "Revenue", 14],
    ["Campaign launch", 3900, "expense", "Marketing", 18],
    ["Workspace rent", 2700, "expense", "Office", 22],
    ["Support contract", 5200, "income", "Revenue", 25],
  ] as const;

  return items.map(([note, amount, type, category, daysAgo], index) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return {
      amount,
      category,
      date: date.toISOString().slice(0, 10),
      id: `demo-transaction-${index + 1}`,
      note,
      type,
    };
  });
}

export default function DemoPage() {
  const [disabledAction, setDisabledAction] = useState("");
  const transactions = useMemo(() => buildTransactions(), []);

  function showDisabledState(action: string) {
    setDisabledAction(action);
    window.setTimeout(() => setDisabledAction(""), 1800);
  }

  function preventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    showDisabledState("Forms are read-only in the public demo.");
  }

  function demoButton(label: string, icon: string, variant: "dark" | "light" = "light") {
    const active = disabledAction === label;

    return (
      <button
        type="button"
        aria-disabled="true"
        onClick={() => showDisabledState(label)}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 ${
          variant === "dark"
            ? "bg-slate-900 text-white hover:bg-slate-700"
            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
        } ${active ? "cursor-not-allowed opacity-55" : ""}`}
      >
        <AppIcon name={icon} />
        {active ? "Disabled in demo" : label}
      </button>
    );
  }

  return (
    <main className="demo-preview-page flex-1 bg-slate-50 text-slate-900">
      <section className="demo-banner sticky top-0 z-30 border-b border-emerald-200 bg-emerald-50/95 px-5 py-3 text-sm font-medium text-emerald-900 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <AppIcon name="shield-check" className="text-emerald-700" />
          <p className="min-w-0 break-words">
            You are currently viewing the Dampener demo preview. Editing and financial
            actions are disabled.
          </p>
        </div>
      </section>

      <section className="demo-preview-shell mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[16rem_1fr]">
        <aside className="demo-sidebar rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <AppIcon name="chart-histogram" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Demo workspace</p>
              <p className="text-xs text-slate-500">Mock data only</p>
            </div>
          </div>

          <nav
            aria-label="Demo navigation"
            className="demo-nav mt-5 flex gap-2 overflow-x-auto pb-1 lg:grid lg:gap-1 lg:overflow-visible lg:pb-0"
          >
            {navItems.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => showDisabledState(`${item.label} navigation`)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-slate-100 lg:shrink ${
                  index === 0 ? "bg-slate-100 text-slate-900" : "text-slate-600"
                }`}
              >
                <AppIcon name={item.icon} solid={index === 0} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 hidden rounded-xl border border-slate-200 bg-slate-50 p-4 lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Access
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">Public preview mode</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              No authentication, user records, uploads, or database writes are used here.
            </p>
          </div>
        </aside>

        <div className="demo-main grid min-w-0 gap-6">
          <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Dampener finance platform</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Dashboard preview
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                A realistic, read-only workspace for portfolio review, UI import tools, and
                safe product exploration.
              </p>
            </div>
            <div className="demo-header-actions flex w-full flex-col gap-2 lg:w-auto lg:flex-row">
              {demoButton("Import file", "file-upload")}
              {demoButton("Add transaction", "add", "dark")}
            </div>
          </header>

          {disabledAction ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
              {disabledAction} is disabled in this public demo preview.
            </section>
          ) : null}

          <section className="metric-grid grid grid-cols-1 gap-4 xl:grid-cols-3">
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className="metric-card overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <p className="min-w-0 break-words text-sm text-slate-500">{metric.label}</p>
                  <span className="icon-badge shrink-0">
                    <AppIcon name={metric.icon} className="text-lg" />
                  </span>
                </div>
                <p className={`mt-3 text-3xl font-semibold tracking-tight ${metric.tone}`}>
                  {metric.value}
                </p>
              </article>
            ))}
          </section>

          <section className="grid gap-4">
            <article className="forecast-stable rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="grid gap-5 lg:grid-cols-[1.05fr_1.4fr] lg:items-stretch">
                <div className="flex flex-col justify-between gap-5">
                  <div className="forecast-summary">
                    <span className="icon-badge forecast-icon">
                      <AppIcon name="shield-check" className="text-lg" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Cash outlook</p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                        $21,860
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        Stable outlook - 30 days - balanced
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Cash is projected to stay steady for the selected horizon.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Expected change from today:{" "}
                      <span className="font-semibold text-emerald-700">$4,420</span>.
                    </p>
                  </div>
                </div>

                <div className="forecast-metrics">
                  {[
                    ["7 days", "$18,930"],
                    ["30 days", "$21,860"],
                    ["90 days", "$24,510"],
                  ].map(([label, value]) => (
                    <div key={label} className="forecast-mini-card">
                      <p>{label}</p>
                      <p>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-medium text-slate-900">Next best actions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Signals worth checking before adding more data.
                </p>
              </div>
              <div className="grid gap-3">
                {recommendations.map((recommendation) => (
                  <button
                    key={recommendation}
                    type="button"
                    onClick={() => showDisabledState("Recommendation action")}
                    className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <AppIcon name="lightbulb-on" className="mt-0.5 text-base text-amber-700" />
                    {recommendation}
                  </button>
                ))}
              </div>
            </section>

            <form
              onSubmit={preventSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-lg font-medium text-slate-900">Forecast controls</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Inputs are preserved visually and locked for demo safety.
                </p>
              </div>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Scenario
                  <input
                    readOnly
                    value="Balanced"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Period
                  <input
                    readOnly
                    value="30 days"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  />
                </label>
                <div className="grid gap-2 text-sm text-slate-600">
                  {["Include recurring records", "Include unpaid invoices", "Include planned spend"].map(
                    (item) => (
                      <label key={item} className="flex items-center gap-3">
                        <input checked readOnly type="checkbox" className="h-4 w-4" />
                        {item}
                      </label>
                    ),
                  )}
                </div>
                {demoButton("Save settings", "disk", "dark")}
              </div>
            </form>
          </section>

          <CashFlowChart currency="USD" transactions={transactions} />

          <section className="grid gap-4 xl:grid-cols-2">
            <CategoryBreakdownChart currency="USD" data={categoryBreakdown} />
            <InvoiceAgingChart
              currency="USD"
              data={{ dueSoon: 6450, overdue: 3820, paid: 19300, unpaid: 8720 }}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-900">Recent transactions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Scrollable sample table. Rows cannot be edited or deleted.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {demoButton("Export", "download")}
                {demoButton("Delete selected", "trash")}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[780px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-600">{transaction.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{transaction.note}</td>
                      <td className="px-4 py-3 text-slate-600">{transaction.category}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            transaction.type === "income"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ${transaction.amount.toLocaleString("en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-900">Invoice queue</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Public preview values with no connection to customer records.
                </p>
              </div>
              {demoButton("Create invoice", "receipt", "dark")}
            </div>
            <div className="grid gap-3">
              {invoiceRows.map(([client, id, amount, status, classes]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => showDisabledState("Invoice editing")}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <span>
                    <span className="block font-medium text-slate-900">{client}</span>
                    <span className="text-sm text-slate-500">{id}</span>
                  </span>
                  <span className="font-semibold text-slate-900">{amount}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
                    {status}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
