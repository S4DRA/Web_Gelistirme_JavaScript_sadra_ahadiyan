import Image from "next/image";
import { PageShell } from "@/components/page-shell";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      description="Control your account experience and app appearance."
    >
      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_240px] md:items-center">
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-medium text-slate-900">Appearance</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose your theme and switch between light and dark mode.
            </p>
          </div>

          <div className="inline-flex">
            <ThemeSwitcher />
          </div>
        </div>

        <div className="brand-lockup-card hidden rounded-2xl border border-slate-200 bg-white p-4 md:block">
          <Image
            src="/img/2.jpg"
            alt="Dampener"
            width={2048}
            height={2048}
            className="h-40 w-full object-contain"
          />
        </div>
      </section>
    </PageShell>
  );
}
