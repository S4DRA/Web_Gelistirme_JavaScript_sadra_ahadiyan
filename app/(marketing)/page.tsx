import Link from "next/link";
import { AppIcon } from "@/components/app-icon";

const features = [
  {
    title: "Cash Flow Tracking",
    description: "See income, expenses, and net movement in one organized financial view.",
    icon: "chart-histogram",
  },
  {
    title: "Invoice Management",
    description: "Track unpaid invoices, due dates, and client balances without spreadsheet clutter.",
    icon: "file-invoice",
  },
  {
    title: "Financial Reports",
    description: "Turn day-to-day activity into clear reports for better planning and review.",
    icon: "document",
  },
  {
    title: "Workspaces & Teams",
    description: "Keep business finances separated by workspace and collaborate with the right people.",
    icon: "users",
  },
];

const previewMetrics = [
  { label: "Income", value: "$12,450", accent: "bg-emerald-500" },
  { label: "Expenses", value: "$7,820", accent: "bg-black" },
  { label: "Net Balance", value: "$4,630", accent: "bg-emerald-500" },
  { label: "Unpaid Invoices", value: "$2,100", accent: "bg-black" },
];

const chartBars = ["h-12", "h-16", "h-14", "h-20", "h-[4.5rem]", "h-24", "h-[5.5rem]", "h-28"];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-white text-black">
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/60 to-white">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.86fr)] lg:py-24">
          <div className="max-w-3xl space-y-7">
            <span className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
              Cash-flow intelligence for growing businesses
            </span>
            <div className="space-y-5">
              <h1 className="text-5xl font-semibold tracking-tight text-black sm:text-6xl lg:text-7xl">
                Cash flow, under control.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Track income, expenses, invoices, reports, and financial health from one
                clean workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Try Demo
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:border-emerald-300 hover:text-emerald-700"
              >
                Login
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Dampener overview</p>
                  <p className="mt-1 text-2xl font-semibold text-black">$4,630</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Healthy
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {previewMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-4">
                    <span className={`block h-1.5 w-10 rounded-full ${metric.accent}`} />
                    <p className="mt-4 text-sm font-medium text-slate-500">{metric.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-black">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-sm font-medium text-slate-500">
                  <span>Cash flow trend</span>
                  <span>Next 30 days</span>
                </div>
                <div className="mt-5 flex h-28 items-end gap-2">
                  {chartBars.map((heightClass, index) => (
                    <span
                      key={index}
                      className={`flex-1 rounded-t-md bg-emerald-500 ${heightClass}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl text-emerald-700">
                <AppIcon name={feature.icon} />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-black">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.8fr_1fr]">
          <div className="space-y-4">
            <span className="text-sm font-bold uppercase tracking-wider text-emerald-700">
              Structured by default
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
              Replace messy spreadsheets with a workspace your business can trust.
            </h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg leading-8 text-slate-700">
              Dampener helps users replace messy spreadsheets with a structured financial
              workspace. Freelancers, small teams, and small businesses can organize cash
              flow, invoices, reports, and financial health without losing context across
              disconnected files.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
