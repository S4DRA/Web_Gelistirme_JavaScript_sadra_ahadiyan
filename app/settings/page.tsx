import { PageShell } from "@/components/page-shell";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      description="Control your account experience and app appearance."
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-slate-900">Appearance</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose your theme and switch between light and dark mode.
          </p>
        </div>

        <div className="inline-flex">
          <ThemeSwitcher />
        </div>
      </section>
    </PageShell>
  );
}
