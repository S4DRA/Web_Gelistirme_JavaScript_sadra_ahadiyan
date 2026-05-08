import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function ChooseThemePage() {
  return (
    <main className="flex flex-1 bg-slate-50 px-6 py-12">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            Account ready
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Choose a theme
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-8 text-slate-600">
            Click your desired theme, then continue to your dashboard.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <ThemeSwitcher />
          <p className="text-sm text-slate-500">
            You can change this anytime from the navigation bar.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Continue to dashboard
        </Link>
      </section>
    </main>
  );
}
