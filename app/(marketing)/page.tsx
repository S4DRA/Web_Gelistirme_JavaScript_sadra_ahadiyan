import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { LeadFormTrigger } from "@/components/lead-form-trigger";

const features = [
  {
    title: "Cash Flow Tracking",
    description: "Track income, expenses, and daily movement with a clean view of money coming in and out.",
    icon: "chart-histogram",
  },
  {
    title: "Invoice Management",
    description: "Monitor unpaid invoices, upcoming due dates, and client balances before they become surprises.",
    icon: "file-invoice",
  },
  {
    title: "Financial Reports",
    description: "Turn records into simple reports for planning, reviews, and smarter financial decisions.",
    icon: "document",
  },
  {
    title: "Workspaces & Teams",
    description: "Separate projects or businesses into workspaces and give teammates the right context.",
    icon: "users",
  },
];

const previewMetrics = [
  { label: "Income", value: "$12,450", accent: "bg-emerald-500" },
  { label: "Expenses", value: "$7,820", accent: "bg-black" },
  { label: "Net Balance", value: "$4,630", accent: "bg-emerald-500" },
  { label: "Unpaid Invoices", value: "$2,100", accent: "bg-black" },
];

const statItems = [
  { value: "4", label: "core finance views" },
  { value: "30 days", label: "cash flow preview" },
  { value: "0", label: "spreadsheet chaos required" },
];

const workflow = [
  {
    title: "Capture activity",
    description: "Add transactions, invoices, and recurring records as the work happens.",
  },
  {
    title: "Understand position",
    description: "See income, expenses, unpaid invoices, and net balance in one place.",
  },
  {
    title: "Plan next moves",
    description: "Use reports and workspace views to make decisions with less guesswork.",
  },
];

const audiences = [
  "Freelancers tracking client work",
  "Small teams managing shared cash flow",
  "Small businesses replacing finance sheets",
];

const trustPoints = [
  {
    title: "One workspace, less switching",
    description: "Keep transactions, invoices, reports, and team context connected instead of jumping between files.",
  },
  {
    title: "Built around decisions",
    description: "The dashboard surfaces the numbers that matter when cash is tight, invoices are late, or planning is due.",
  },
  {
    title: "Simple enough to keep current",
    description: "Dampener is designed for everyday use by operators who need clarity without accounting software weight.",
  },
];

const contactChannels = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/dampener/?viewAsMember=true",
    icon: "linkedin",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/d4mpener/",
    icon: "instagram",
  },
];

const chartBars = ["h-12", "h-16", "h-14", "h-20", "h-[4.5rem]", "h-24", "h-[5.5rem]", "h-28"];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col overflow-x-hidden bg-white text-black">
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/70 to-white">
        <div className="pointer-events-none absolute -right-20 top-28 h-48 w-48 rounded-full bg-emerald-200/60 blur-3xl sm:h-72 sm:w-72" />
        <div className="pointer-events-none absolute -left-24 bottom-16 h-44 w-44 rounded-full bg-slate-200/70 blur-3xl sm:h-64 sm:w-64" />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 py-10 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)] lg:gap-12 lg:py-24">
          <div className="relative min-w-0 max-w-3xl space-y-6 sm:space-y-7">
            <span className="inline-flex w-fit max-w-full whitespace-normal rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold leading-5 text-emerald-700 shadow-sm sm:px-4 sm:text-sm">
              Cash-flow intelligence for independent businesses
            </span>
            <div className="space-y-4 sm:space-y-5">
              <h1 className="max-w-[11ch] text-5xl font-semibold leading-[0.95] tracking-tight text-black sm:max-w-none sm:text-6xl lg:text-7xl">
                Cash flow, under control.
              </h1>
              <p className="max-w-[calc(100vw-2.5rem)] text-base leading-7 text-slate-600 sm:hidden">
                Track income, expenses, invoices, and reports from one clean workspace.
              </p>
              <p className="hidden max-w-2xl text-xl leading-8 text-slate-600 sm:block">
                Track income, expenses, invoices, reports, and financial health from one
                clean workspace.
              </p>
            </div>
            <div className="grid w-[calc(100vw-7rem)] max-w-full gap-3 sm:flex sm:w-auto sm:flex-wrap">
              <LeadFormTrigger
                source="demo"
                className="inline-flex min-w-0 items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Try Demo
              </LeadFormTrigger>
              <Link
                href="/login"
                className="inline-flex min-w-0 items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:border-emerald-300 hover:text-emerald-700"
              >
                Login
              </Link>
            </div>
            <div className="hidden w-[calc(100vw-4rem)] max-w-full gap-3 sm:grid sm:w-auto sm:max-w-2xl sm:grid-cols-3">
              {statItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm sm:border-l sm:border-r-0 sm:border-y-0 sm:bg-transparent sm:p-0 sm:pl-4 sm:shadow-none"
                >
                  <p className="text-2xl font-semibold text-black">{item.value}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-w-0 max-w-[calc(100vw-6rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:max-w-none sm:p-4">
            <div className="absolute right-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white shadow-sm sm:hidden">
              Preview
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Dampener overview</p>
                  <p className="mt-1 text-2xl font-semibold text-black">$4,630</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Healthy
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {previewMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                    <span className={`block h-1.5 w-10 rounded-full ${metric.accent}`} />
                    <p className="mt-3 text-xs font-medium text-slate-500 sm:text-sm">{metric.label}</p>
                    <p className="mt-1 text-lg font-semibold text-black sm:text-2xl">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-sm font-medium text-slate-500">
                  <span>Cash flow trend</span>
                  <span>Next 30 days</span>
                </div>
                <div className="mt-5 flex h-24 items-end gap-2 sm:h-28">
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

      <section className="border-y border-slate-100 bg-white px-5 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-emerald-700">What it brings together</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black sm:text-4xl">
              The finance workspace between your bank account and your decisions.
            </h2>
          </div>
          <div className="-mx-5 mt-8 flex snap-x gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="min-w-[17rem] snap-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:min-w-0"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl text-emerald-700">
                  <AppIcon name={feature.icon} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.82fr_1fr]">
          <div className="space-y-4">
            <span className="text-sm font-bold uppercase text-emerald-700">
              Structured by default
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-black sm:text-4xl">
              Replace messy spreadsheets with a workspace your business can trust.
            </h2>
            <p className="text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Dampener helps users replace messy spreadsheets with a structured financial
              workspace. It keeps the operational details close to the numbers, so teams
              can understand what happened, what is unpaid, and what needs attention next.
            </p>
          </div>
          <div className="grid gap-4">
            {workflow.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-black">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl bg-black p-6 text-white sm:p-8">
            <p className="text-sm font-bold uppercase text-emerald-300">Built for clarity</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-4xl">
              Know where the money is moving before it becomes urgent.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Dampener gives freelancers and small operators a simple way to track cash
              flow, spot unpaid work, and review financial health without building a new
              spreadsheet every week.
            </p>
          </div>
          <div className="grid gap-3">
            {audiences.map((audience) => (
              <div key={audience} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <AppIcon name="check" />
                </span>
                <p className="font-medium text-slate-800">{audience}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase text-emerald-700">Why Dampener</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black sm:text-4xl">
              A calm financial command center for the work behind the numbers.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {trustPoints.map((point) => (
              <article key={point.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                  <AppIcon name="sparkles" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-black">{point.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{point.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white px-5 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[0.9fr_1fr]">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">Contact us</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black sm:text-4xl">
              Want to talk through Dampener for your business?
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Send a demo or contact request and it will go directly to the Dampener team.
              You can also follow the product updates on LinkedIn and Instagram.
            </p>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
              <LeadFormTrigger
                source="contact"
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Contact us
              </LeadFormTrigger>
              {contactChannels.map((channel) => (
                <Link
                  key={channel.label}
                  href={channel.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  <AppIcon name={channel.icon} />
                  {channel.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl bg-slate-50 p-5">
              
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Try Demo and Contact us.
              </p>
              
            </div>
            
           
          </div>
        </div>
      </section>

      <section className="bg-emerald-50 px-5 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">Ready to see it?</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
              Try Dampener with sample data first.
            </h2>
          </div>
          <LeadFormTrigger
            source="demo"
            className="inline-flex w-full items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            Try Demo
          </LeadFormTrigger>
        </div>
      </section>
    </main>
  );
}
