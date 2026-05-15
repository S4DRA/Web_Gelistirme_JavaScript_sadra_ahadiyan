import Image from "next/image";
import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import {
  ConnectedJourney,
  HeaderScrollState,
  HeroCinematicScene,
  HeroProductStage,
  HeroTitle,
  Landing3DDepthController,
  LandingMotionEngine,
  LogoOpeningScene,
  RevealSection,
  ScrollAtmosphere,
  ScrollProgress,
  SectionWipe,
  StickyProductStory,
} from "./landing-motion";

const stressSignals = [
  {
    icon: "cloud-question",
    title: "The balance changes, but the story is unclear.",
    text: "Transactions, invoices, and planned spend live apart, so confidence turns into guessing.",
  },
  {
    icon: "calendar-clock",
    title: "Pressure appears after it is already expensive.",
    text: "Due dates, recurring costs, and cash dips are noticed too late to act calmly.",
  },
  {
    icon: "file-exclamation",
    title: "Imports create more work than answers.",
    text: "Bank files bring useful data, but messy headers and duplicate rows slow the decision.",
  },
];

const intelligenceFlow = [
  ["Collect", "Bank activity, manual records, invoices, budgets, recurring spend."],
  ["Normalize", "Dates, currencies, descriptions, categories, balances, duplicates."],
  ["Forecast", "Runway, upcoming pressure, invoice timing, planned expenses."],
  ["Explain", "Plain-language insight that shows why the numbers changed."],
];

const productMoments = [
  {
    label: "Import flow",
    title: "Review before save",
    text: "Every file becomes a preview first, with invalid rows and duplicates separated.",
    icon: "file-upload",
  },
  {
    label: "Forecast card",
    title: "Pressure before panic",
    text: "Future balance is framed as a decision signal, not a mysterious score.",
    icon: "chart-line-up",
  },
  {
    label: "Invoice workflow",
    title: "Open payments stay visible",
    text: "Unpaid invoices keep their effect on cash flow until they are resolved.",
    icon: "receipt",
  },
];

const trustItems = [
  ["Safe imports", "Nothing touches your records until the preview is confirmed."],
  ["Prediction transparency", "Forecasts show which assumptions influence the result."],
  ["Duplicate detection", "Repeated rows are identified before they create false activity."],
  ["Clear logic", "Financial signals are explained in readable operational language."],
];

const proofSignals = [
  "Cash-flow visibility",
  "Invoice pressure",
  "Safe imports",
  "Forecast control",
  "Duplicate detection",
  "Decision confidence",
];

const outcomes = [
  "Know what changed.",
  "Understand what is coming.",
  "Act before pressure builds.",
  "Make financial decisions with calm confidence.",
];

const chartBars = ["34%", "48%", "42%", "62%", "56%", "78%", "68%", "86%", "74%", "92%", "82%", "88%"];

const transactions = [
  ["Stripe payout", "+$4,820", "Income"],
  ["Cloud renewal", "-$640", "Expense"],
  ["Invoice AC-104", "+$2,400", "Paid"],
];

const invoices = [
  ["Northline", "$4,200", "Due in 4 days"],
  ["Studio Retainer", "$2,800", "Open"],
  ["Atlas Supply", "$1,150", "Review"],
];

export default function Home() {
  return (
    <main className="studio-landing-page">
      <HeaderScrollState />
      <LandingMotionEngine />
      <Landing3DDepthController />
      <ScrollProgress />
      <ScrollAtmosphere />
      <ConnectedJourney />
      <LogoOpeningScene />
      <HeroSection />
      <SignalStrip />
      <SectionWipe label="The pressure comes into focus" number="02" />
      <ProblemSection />
      <SectionWipe label="The system starts connecting" number="03" />
      <SystemIntelligenceSection />
      <SignalEngineSection />
      <RealSystemShowcase />
      <StickyProductStory />
      <SectionWipe label="The product assembles around decisions" number="06" />
      <ProductExperienceSection />
      <TrustSection />
      <OutcomeSection />
      <FinalCtaSection />
      <LandingFooter />
    </main>
  );
}

function SignalEngineSection() {
  return (
    <RevealSection className="studio-section studio-engine" labelledBy="engine-heading">
      <div className="studio-container studio-engine-grid">
        <div className="studio-section-heading">
          <SectionMeta label="Animated signal engine" number="04" />
          <h2 id="engine-heading">Every financial signal moves with purpose.</h2>
          <p>
            Dampener shows the rhythm underneath the workspace: staggered data fields, drawn
            forecast routes, and a spring control that makes pressure tangible.
          </p>
        </div>

        <div className="studio-engine-console studio-stagger-child" aria-label="Animated financial signal engine">
          <div className="studio-engine-header">
            <div>
              <p>Signal composer</p>
              <h3>Live cash-flow choreography</h3>
            </div>
            <span>Live motion layer</span>
          </div>

          <div className="studio-engine-stage">
            <div className="studio-signal-field" aria-hidden="true">
              {Array.from({ length: 63 }, (_, index) => (
                <span className="studio-signal-dot" key={index} />
              ))}
            </div>

            <svg className="studio-engine-map" viewBox="0 0 420 220" aria-hidden="true">
              <defs>
                <linearGradient id="studioEngineGradient" x1="24" y1="168" x2="396" y2="62" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="48%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <path
                className="studio-engine-path studio-engine-path-shadow"
                d="M24 168 C78 86 134 190 188 108 C238 30 284 126 328 74 C356 42 382 46 396 62"
              />
              <path
                className="studio-engine-path"
                d="M24 168 C78 86 134 190 188 108 C238 30 284 126 328 74 C356 42 382 46 396 62"
              />
            </svg>

            <div className="studio-pressure-rail" aria-label="Drag to test financial pressure">
              <button className="studio-pressure-orb" type="button" aria-label="Drag pressure control">
                <AppIcon name="bolt" />
              </button>
              <span>low pressure</span>
              <span>action window</span>
            </div>
          </div>

          <div className="studio-engine-metrics">
            <article className="studio-motion-value">
              <span>Forecast sync</span>
              <strong data-target-value="98">98</strong>
              <em>%</em>
            </article>
            <article className="studio-motion-value">
              <span>Rows checked</span>
              <strong data-target-value="724">724</strong>
              <em></em>
            </article>
            <article className="studio-motion-value">
              <span>Decision lag</span>
              <strong data-target-value="12">12</strong>
              <em>min</em>
            </article>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}

function HeroSection() {
  return (
    <HeroCinematicScene className="studio-hero" labelledBy="hero-heading">
      <div className="studio-ambient" aria-hidden="true" />
      <div className="studio-container studio-hero-grid">
        <div className="studio-hero-copy">
          <SectionMeta className="studio-hero-item studio-hero-delay-0" label="Premium financial clarity workspace" number="01" />
          <HeroTitle id="hero-heading" text="Control your cash flow before it controls you." />
          <p className="studio-hero-item studio-hero-delay-2">
            Dampener turns income, expenses, invoices, forecasts, and financial behavior into a
            calm operating system for decisions.
          </p>
          <div className="studio-actions studio-hero-item studio-hero-delay-3">
            <Link href="/demo" className="studio-button studio-button-primary">
              Try Demo
              <AppIcon name="arrow-small-right" />
            </Link>
            <a href="#system" className="studio-button studio-button-secondary">
              Explore the system
            </a>
          </div>
          <div
            className="studio-hero-trust studio-hero-item studio-hero-delay-4"
            aria-label="Product trust highlights"
          >
            <span>Review-before-save imports</span>
            <span>Transparent forecasts</span>
            <span>Calm cash-flow intelligence</span>
          </div>
        </div>
        <HeroProductStage>
          <OperatingSystemPreview />
        </HeroProductStage>
      </div>
    </HeroCinematicScene>
  );
}

function SignalStrip() {
  return (
    <section className="studio-proof-strip" aria-label="Dampener product signals">
      <div className="studio-proof-track">
        {[...proofSignals, ...proofSignals].map((signal, index) => (
          <span key={`${signal}-${index}`}>{signal}</span>
        ))}
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <RevealSection className="studio-section studio-section-soft" labelledBy="problem-heading">
      <div className="studio-container">
        <div className="studio-section-heading studio-narrow">
          <SectionMeta label="The pressure underneath the numbers" number="02" />
          <h2 id="problem-heading">Financial stress is usually a visibility problem.</h2>
          <p>
            People do not need louder dashboards. They need fewer blind spots, better pacing, and a
            system that makes the next decision feel obvious.
          </p>
        </div>
        <div className="studio-stress-grid">
          {stressSignals.map((signal) => (
            <article className="studio-card studio-stagger-child" key={signal.title}>
              <span className="studio-icon">
                <AppIcon name={signal.icon} />
              </span>
              <h3>{signal.title}</h3>
              <p>{signal.text}</p>
            </article>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}

function SystemIntelligenceSection() {
  return (
    <RevealSection id="system" className="studio-section studio-system" labelledBy="system-heading">
      <div className="studio-container studio-split">
        <div className="studio-section-heading">
          <SectionMeta label="System intelligence" number="03" />
          <h2 id="system-heading">A financial operating layer, not another spreadsheet.</h2>
          <p>
            Dampener connects the workflow from raw activity to decision-ready insight, keeping the
            logic understandable at every step.
          </p>
        </div>
        <div className="studio-flow-panel studio-stagger-child">
          {intelligenceFlow.map(([title, text], index) => (
            <article key={title} className="studio-flow-step studio-stagger-child">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}

function RealSystemShowcase() {
  return (
    <RevealSection className="studio-section studio-real-system" labelledBy="real-system-heading">
      <div className="studio-container">
        <div className="studio-showcase-heading">
          <div className="studio-section-heading studio-narrow">
            <SectionMeta label="Real Dampener interface" number="05" />
            <h2 id="real-system-heading">Actual product surfaces, composed like a financial command room.</h2>
            <p>
              These previews use the live public Dampener demo UI: dashboard metrics, forecast
              cards, import actions, analytics, invoices, and workspace navigation.
            </p>
          </div>
          <Link href="/demo" className="studio-button studio-button-secondary">
            Open demo
          </Link>
        </div>

        <div className="studio-system-gallery">
          <figure className="studio-system-frame studio-system-frame-primary studio-stagger-child">
            <Image
              src="/landing/dampener-demo-dashboard.png"
              alt="Real Dampener demo dashboard with financial metrics, forecast, and workspace navigation"
              width={1440}
              height={1300}
              sizes="(max-width: 980px) calc(100vw - 2rem), 58vw"
            />
            <figcaption>
              <span>Dashboard</span>
              Metrics, forecast, actions, and workspace context.
            </figcaption>
          </figure>

          <figure className="studio-system-frame studio-system-frame-secondary studio-stagger-child">
            <Image
              src="/landing/dampener-demo-workflow.png"
              alt="Real Dampener demo workspace showing extended forecast, metrics, and financial workflow"
              width={1180}
              height={1900}
              sizes="(max-width: 980px) calc(100vw - 2rem), 34vw"
            />
            <figcaption>
              <span>Workflow</span>
              Review flows, chart context, and financial state.
            </figcaption>
          </figure>
        </div>
      </div>
    </RevealSection>
  );
}

function ProductExperienceSection() {
  return (
    <RevealSection className="studio-section studio-product" labelledBy="experience-heading">
      <div className="studio-container">
        <div className="studio-section-heading studio-narrow">
          <SectionMeta label="Product experience" number="06" />
          <h2 id="experience-heading">Users should feel the product before signing in.</h2>
          <p>
            The preview behaves like a real workspace: activity, imports, invoices, forecasts, and
            explanations all point to the same cash-flow story.
          </p>
        </div>
        <div className="studio-product-grid">
          <ProductConsole />
          <div className="studio-moment-stack">
            {productMoments.map((moment) => (
              <article key={moment.title} className="studio-moment studio-stagger-child">
                <span className="studio-icon">
                  <AppIcon name={moment.icon} />
                </span>
                <div>
                  <p>{moment.label}</p>
                  <h3>{moment.title}</h3>
                  <span>{moment.text}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </RevealSection>
  );
}

function TrustSection() {
  return (
    <RevealSection className="studio-section studio-trust" labelledBy="trust-heading">
      <div className="studio-container studio-split">
        <div className="studio-section-heading">
          <SectionMeta label="Trust and stability" number="07" />
          <h2 id="trust-heading">Built to reduce uncertainty before records are saved.</h2>
          <p>
            Financial software earns trust when it slows down at the right moments: previewing,
            explaining, checking, and confirming.
          </p>
        </div>
        <div className="studio-trust-grid">
          {trustItems.map(([title, text]) => (
            <article key={title} className="studio-trust-item studio-stagger-child">
              <span aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}

function OutcomeSection() {
  return (
    <RevealSection className="studio-section studio-outcome" labelledBy="outcome-heading">
      <div className="studio-container">
        <div className="studio-outcome-panel studio-stagger-child">
          <div className="studio-section-heading">
            <SectionMeta label="The transformation" number="08" />
            <h2 id="outcome-heading">From financial noise to calm control.</h2>
          </div>
          <div className="studio-outcome-list">
            {outcomes.map((outcome) => (
              <p className="studio-stagger-child" key={outcome}>
                {outcome}
              </p>
            ))}
          </div>
        </div>
      </div>
    </RevealSection>
  );
}

function FinalCtaSection() {
  return (
    <RevealSection className="studio-final" labelledBy="final-heading">
      <div className="studio-container">
        <div className="studio-final-card studio-stagger-child">
          <SectionMeta label="Start with a calmer view" number="09" />
          <h2 id="final-heading">Understand your money with premium financial clarity.</h2>
          <p>
            Try the demo workspace and experience how Dampener turns financial movement into
            decisions you can trust.
          </p>
          <Link href="/demo" className="studio-button studio-button-primary">
            Try Demo
            <AppIcon name="arrow-small-right" />
          </Link>
        </div>
      </div>
    </RevealSection>
  );
}

function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="studio-footer" aria-labelledby="footer-heading">
      <div className="studio-container">
        <div className="studio-footer-panel">
          <div className="studio-footer-brand">
            <Link href="/" className="studio-footer-logo" aria-label="Dampener home">
              <Image src="/img/1.svg" alt="" width={36} height={36} />
              <span>Dampener</span>
            </Link>
            <h2 id="footer-heading">Calm financial decisions, from import to forecast.</h2>
            <p>
              A premium cash-flow workspace for seeing what changed, what is coming, and what to do next.
            </p>
          </div>

          <nav className="studio-footer-nav" aria-label="Footer navigation">
            <div>
              <h3>Explore</h3>
              <a href="#system">System</a>
              <a href="#engine-heading">Signals</a>
              <a href="#real-system-heading">Product</a>
            </div>
            <div>
              <h3>Workspace</h3>
              <Link href="/demo">Demo</Link>
              <Link href="/request-access">Request Access</Link>
              <Link href="/login">Login</Link>
            </div>
            <div>
              <h3>Principles</h3>
              <span>Review before save</span>
              <span>Transparent forecasts</span>
              <span>Clear financial logic</span>
            </div>
          </nav>
        </div>

        <div className="studio-footer-bottom">
          <p>&copy; {year} Dampener. Built for calmer financial control.</p>
          <div>
            <Link href="/demo">Try Demo</Link>
            <Link href="/request-access">Request Access</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SectionMeta({
  className = "",
  label,
  number,
}: {
  className?: string;
  label: string;
  number: string;
}) {
  return (
    <p className={`studio-kicker studio-section-meta ${className}`.trim()}>
      <span>{label}</span>
      <em>DMP - {number}</em>
    </p>
  );
}

function OperatingSystemPreview() {
  return (
    <section
      className="studio-os-preview studio-hero-preview"
      aria-label="Dampener financial operating system preview"
    >
      <div className="studio-preview-top">
        <div>
          <p>Dampener OS</p>
          <h2>Cash-flow command</h2>
        </div>
        <span>Stable</span>
      </div>
      <div className="studio-metric-grid">
        <Metric label="Cash balance" value="$18.4K" status="+12%" index={1} />
        <Metric label="Invoice exposure" value="$6.2K" status="4 open" index={2} />
        <Metric label="Runway" value="5.8 mo" status="balanced" index={3} />
      </div>
      <div className="studio-preview-body">
        <div className="studio-chart-card studio-dashboard-layer studio-assemble-chart">
          <div className="studio-card-header">
            <span>Forecast path</span>
            <strong>Next 90 days</strong>
          </div>
          <div className="studio-chart" aria-hidden="true">
            {chartBars.map((height, index) => (
              <span key={`${height}-${index}`} style={{ height }} />
            ))}
          </div>
        </div>
        <div className="studio-insight-card studio-dashboard-layer studio-assemble-insight">
          <span className="studio-icon">
            <AppIcon name="sparkles" />
          </span>
          <h3>Insight</h3>
          <p>Invoice timing is improving, but renewals create pressure in 23 days.</p>
        </div>
      </div>
    </section>
  );
}

function ProductConsole() {
  return (
    <section className="studio-console studio-stagger-child" aria-label="Product workflow preview">
      <div className="studio-console-header">
        <div>
          <p>Workspace activity</p>
          <h3>May cash movement</h3>
        </div>
        <span>Preview mode</span>
      </div>
      <div className="studio-console-grid">
        <div className="studio-console-panel studio-dashboard-layer">
          <div className="studio-card-header">
            <span>Transactions</span>
            <strong>3 latest</strong>
          </div>
          {transactions.map(([name, amount, type]) => (
            <div className="studio-row" key={name}>
              <span>{name}</span>
              <strong className={amount.startsWith("+") ? "is-positive" : ""}>{amount}</strong>
              <em>{type}</em>
            </div>
          ))}
        </div>
        <div className="studio-console-panel studio-dashboard-layer">
          <div className="studio-card-header">
            <span>Invoices</span>
            <strong>$8.1K open</strong>
          </div>
          {invoices.map(([name, amount, status]) => (
            <div className="studio-row" key={name}>
              <span>{name}</span>
              <strong>{amount}</strong>
              <em>{status}</em>
            </div>
          ))}
        </div>
      </div>
      <div className="studio-import-strip studio-data-pulse">
        <span>
          <AppIcon name="shield-check" />
        </span>
        <p>Excel import preview found 42 valid rows, 3 duplicates, and 1 footer row skipped.</p>
      </div>
    </section>
  );
}

function Metric({
  index,
  label,
  status,
  value,
}: {
  index: number;
  label: string;
  status: string;
  value: string;
}) {
  return (
    <article className={`studio-metric-card studio-dashboard-layer studio-assemble-card studio-assemble-card-${index}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{status}</span>
    </article>
  );
}
