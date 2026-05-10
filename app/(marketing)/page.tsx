import Image from "next/image";
import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { LeadFormTrigger } from "@/components/lead-form-trigger";

const platformPillars = [
  {
    title: "Cash command",
    description: "Live totals, invoice pressure, runway, and cash movement in one operating view.",
    icon: "dashboard-monitor",
  },
  {
    title: "Imports that clean up",
    description: "Bring bank activity from CSV or Excel, preview rows, catch duplicates, and confirm safely.",
    icon: "file-upload",
  },
  {
    title: "Forecast controls",
    description: "Tune periods, scenarios, recurring records, planned spend, and invoice assumptions.",
    icon: "chart-line-up",
  },
  {
    title: "Currency aware",
    description: "Track original amounts and convert them into the workspace currency with live rates.",
    icon: "coins",
  },
];

const proofItems = [
  "Freelancer-ready",
  "Multi-currency",
  "Excel import",
  "Invoice pipeline",
  "Team workspaces",
  "Scenario forecasts",
];

const flowSteps = [
  ["01", "Collect", "Transactions, invoices, recurring costs, and imported bank rows."],
  ["02", "Resolve", "Duplicates, currencies, categories, dates, and missing context before saving."],
  ["03", "Decide", "See the cash story, risk signals, and next actions without rebuilding a spreadsheet."],
];

const importSafeguards = [
  {
    title: "Preview first",
    text: "Imported rows are shown before they become transactions, including detected dates, categories, notes, and currencies.",
    icon: "table-layout",
  },
  {
    title: "Catch bad rows",
    text: "Missing amounts, unknown transaction types, invalid dates, and unclear headers are separated for review.",
    icon: "shield-check",
  },
  {
    title: "Skip duplicates",
    text: "Dampener compares amount, date, type, category, notes, and source fingerprints before saving new records.",
    icon: "copy-alt",
  },
];

const predictionControls = [
  "Pick a 7 day, 30 day, 3 month, 6 month, or 1 year window.",
  "Switch between conservative, balanced, and optimistic assumptions.",
  "Include or remove recurring records, planned expenses, and unpaid invoices.",
  "Read the explanation behind the number so the result is not a black box.",
];

const signalCards = [
  { label: "Expected balance", value: "$18.4K", delta: "+12%", icon: "wallet" },
  { label: "Invoice exposure", value: "$6.2K", delta: "4 open", icon: "receipt" },
  { label: "Runway", value: "5.8 mo", delta: "balanced", icon: "calendar-clock" },
];

const workspaceViews = [
  {
    title: "Dashboard",
    text: "A calm first screen with the cards, charts, and sections your team actually wants visible.",
  },
  {
    title: "Transactions",
    text: "Add records manually or import a bank file with validation before anything touches the database.",
  },
  {
    title: "Insights",
    text: "Translate movement into plain-language guidance, not just another table of numbers.",
  },
  {
    title: "Settings",
    text: "Keep currency, prediction behavior, appearance, and data controls where operators expect them.",
  },
];

const outcomes = [
  { value: "7-365", label: "day forecast windows" },
  { value: "500", label: "rows per safe import" },
  { value: "13+", label: "supported currencies" },
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

export default function Home() {
  return (
    <main className="landing-page flex flex-1 flex-col overflow-x-hidden bg-[#06110f] text-white">
      <section className="landing-hero relative isolate overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-4.25rem)] w-full max-w-7xl items-center gap-10 px-5 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:gap-10 lg:py-20">
          <div className="relative z-10 max-w-4xl">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/30 bg-white/8 px-3 py-2 text-xs font-semibold text-cyan-100 shadow-2xl shadow-cyan-950/30 backdrop-blur sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_20px_rgba(190,242,100,0.75)]" />
              Finance operations without spreadsheet drift
            </div>

            <h1 className="max-w-5xl text-[2.65rem] font-semibold leading-[0.96] tracking-tight text-white sm:text-7xl lg:text-8xl">
              See cash clearly before it moves.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-cyan-50/78 sm:text-xl sm:leading-8">
              Dampener turns bank activity, invoices, forecasts, currencies, and team
              workspaces into one readable financial command center.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LeadFormTrigger
                source="demo"
                className="inline-flex items-center justify-center rounded-full bg-lime-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
              >
                Try Demo
              </LeadFormTrigger>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/18 bg-white/8 px-6 py-3 text-sm font-bold text-white transition hover:border-cyan-200/70 hover:bg-white/14"
              >
                Login
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3 sm:mt-10">
              {outcomes.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur">
                  <p className="text-2xl font-semibold text-lime-200">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-cyan-50/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-orbit-wrap relative z-10 mx-auto w-full max-w-[34rem] lg:mx-0 lg:justify-self-center">
            <div className="landing-orbit">
              <div className="landing-orbit-ring landing-ring-a" />
              <div className="landing-orbit-ring landing-ring-b" />
              <div className="landing-dashboard">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Image src="/img/1.svg" alt="" width={34} height={34} className="h-8 w-8 invert" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100/60">
                        Dampener
                      </p>
                      <p className="text-lg font-semibold text-white">Cash cockpit</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-bold text-slate-950">
                    Stable
                  </span>
                </div>

                <div className="landing-signal-grid grid gap-3 sm:grid-cols-3">
                  {signalCards.map((card) => (
                    <div key={card.label} className="landing-signal-card">
                      <AppIcon name={card.icon} className="text-lg text-cyan-200" />
                      <p className="mt-3 text-xs text-cyan-50/60">{card.label}</p>
                      <p className="mt-1 text-xl font-semibold text-white">{card.value}</p>
                      <p className="mt-2 text-xs font-semibold text-lime-200">{card.delta}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="mb-4 flex items-center justify-between text-xs font-semibold text-cyan-50/62">
                    <span>Cash path</span>
                    <span>Next 90 days</span>
                  </div>
                  <div className="landing-flow-chart">
                    {["42%", "58%", "46%", "70%", "64%", "86%", "78%", "92%"].map((height, index) => (
                      <span key={`${height}-${index}`} style={{ height }} />
                    ))}
                  </div>
                </div>

                <div className="landing-ticker mt-4" aria-label="Recent finance signals">
                  <span>TRY import detected</span>
                  <span>3 duplicates skipped</span>
                  <span>Forecast balanced</span>
                  <span>Invoice due soon</span>
                  <span>TRY import detected</span>
                  <span>3 duplicates skipped</span>
                  <span>Forecast balanced</span>
                  <span>Invoice due soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <section className="border-y border-white/10 bg-[#091916] px-5 py-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3">
          {proofItems.map((item) => (
            <span
              key={item}
              className="rounded-full border border-cyan-200/15 bg-white/6 px-4 py-2 text-sm font-semibold text-cyan-50/76"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section id="workspace" className="landing-reveal bg-[#f4fbf8] px-5 py-16 text-slate-950 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
              One workspace
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Every money signal, connected and explainable.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {platformPillars.map((item, index) => (
              <article key={item.title} className="landing-feature-card">
                <span className="landing-card-index">0{index + 1}</span>
                <span className="mt-8 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-950 text-xl text-lime-200">
                  <AppIcon name={item.icon} />
                </span>
                <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-reveal bg-white px-5 py-16 text-slate-950 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
              Operating flow
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Import, validate, forecast, and act.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The product is designed around the work operators repeat every week:
              collecting records, cleaning the messy parts, and making a decision from the result.
            </p>
          </div>

          <div className="grid gap-4">
            {flowSteps.map(([number, title, text]) => (
              <div key={title} className="landing-flow-step">
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-reveal bg-[#edf7f2] px-5 py-16 text-slate-950 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
              Data controls
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Imports stay reviewable until you approve them.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Dampener is designed for real bank exports, messy descriptions, mixed currencies,
              and repeated rows. The import flow explains what it found before anything is saved.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {importSafeguards.map((item) => (
              <article key={item.title} className="landing-detail-card">
                <span>
                  <AppIcon name={item.icon} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-reveal bg-[#07130f] px-5 py-16 text-white sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime-200">
              Forecast logic
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Predictions that show their assumptions.
            </h2>
            <p className="mt-5 text-lg leading-8 text-cyan-50/72">
              Cash prediction is not treated like a magic number. Teams can decide how cautious
              the forecast should be and exactly which records are allowed to influence it.
            </p>
          </div>

          <div className="landing-assumption-panel">
            {predictionControls.map((item, index) => (
              <div key={item} className="landing-assumption-row">
                <span>0{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-reveal bg-[#07130f] px-5 py-16 text-white sm:px-6 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime-200">
                Product views
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                Familiar pages, sharper financial behavior.
              </h2>
            </div>
            <p className="text-lg leading-8 text-cyan-50/72">
              Dampener keeps the interface calm while the system handles richer data:
              currency conversion, import validation, dashboard layout, and prediction preferences.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {workspaceViews.map((view) => (
              <article key={view.title} className="landing-view-card">
                <h3>{view.title}</h3>
                <p>{view.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="landing-reveal bg-[#eff8f3] px-5 py-16 text-slate-950 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-teal-900/10 bg-white p-6 shadow-2xl shadow-teal-950/10 sm:p-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
              See Dampener
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Start with a demo workspace, then bring your own numbers.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Try the product with sample data or contact the Dampener team to talk through
              your workflow.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <LeadFormTrigger
                source="demo"
                className="inline-flex items-center justify-center rounded-full bg-teal-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
              >
                Try Demo
              </LeadFormTrigger>
              <LeadFormTrigger
                source="contact"
                className="inline-flex items-center justify-center rounded-full border border-teal-900/15 bg-white px-6 py-3 text-sm font-bold text-teal-950 transition hover:border-teal-700 hover:text-teal-700"
              >
                Contact us
              </LeadFormTrigger>
            </div>
          </div>

          <div className="grid content-between gap-4 rounded-[1.5rem] bg-[#07130f] p-5 text-white">
            <div>
              <p className="text-sm font-semibold text-cyan-100/70">Follow the build</p>
              <div className="mt-4 grid gap-3">
                {contactChannels.map((channel) => (
                  <Link
                    key={channel.label}
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
                  >
                    <span className="inline-flex items-center gap-2">
                      <AppIcon name={channel.icon} />
                      {channel.label}
                    </span>
                    <AppIcon name="arrow-small-right" />
                  </Link>
                ))}
              </div>
            </div>
            <p className="rounded-2xl border border-lime-200/20 bg-lime-200/10 p-4 text-sm leading-6 text-lime-50">
              Built for people who need financial clarity before accounting software becomes
              the center of the room.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
