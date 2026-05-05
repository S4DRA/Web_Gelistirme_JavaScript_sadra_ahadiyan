import { PageShell } from "@/components/page-shell";

export default function ReportsPage() {
  return (
    <PageShell
      title="Reports"
      description="Export workspace data for accounting, reviews, and monthly reporting."
    >
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Transactions CSV</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Download income and expenses for spreadsheet analysis or accounting.
          </p>
          <a
            href="/api/exports?type=transactions"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Export transactions
          </a>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Invoices CSV</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Download due dates, reminder dates, payment status, and invoice amounts.
          </p>
          <a
            href="/api/exports?type=invoices"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Export invoices
          </a>
        </article>
      </section>
    </PageShell>
  );
}
