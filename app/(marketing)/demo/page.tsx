import Link from "next/link";
import { AppIcon } from "@/components/app-icon";

const metrics = [
  { label: "Income", value: "$12,450" },
  { label: "Expenses", value: "$7,820" },
  { label: "Net Balance", value: "$4,630" },
  { label: "Unpaid Invoices", value: "$2,100" },
];

const chartBars = [
  "h-28",
  "h-36",
  "h-32",
  "h-44",
  "h-40",
  "h-52",
  "h-48",
  "h-60",
  "h-52",
];

export default function DemoPage() {
  return (
    <main className="flex flex-1 bg-slate-50 px-6 py-12">
      <section className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              Demo workspace
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">
              Explore Dampener with sample data.
            </h1>
            <p className="mt-3 text-lg leading-8 text-slate-600">
              This demo uses fake numbers only, so you can see how the workspace feels
              before logging in.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Login
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-xl border border-slate-200 p-5">
                <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-black">{metric.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_22rem]">
            <div className="rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-black">Cash flow trend</h2>
                <AppIcon name="chart-histogram" className="text-emerald-700" />
              </div>
              <div className="mt-6 flex h-64 items-end gap-3">
                {chartBars.map((heightClass, index) => (
                  <span
                    key={index}
                    className={`flex-1 rounded-t-lg bg-emerald-500 ${heightClass}`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-black">Invoice queue</h2>
              <div className="mt-5 space-y-3">
                {["Studio retainer", "Website sprint", "Maintenance plan"].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                    <span className="text-sm font-semibold text-black">
                      ${[900, 750, 450][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
