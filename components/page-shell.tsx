import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  unifiedSurface?: boolean;
};

export function PageShell({
  title,
  description,
  actions,
  children,
  unifiedSurface = false,
}: PageShellProps) {
  return (
    <main className="flex-1 bg-slate-50">
      <div
        className={`page-shell-inner mx-auto flex w-full flex-col gap-8 px-6 py-10 ${
          unifiedSurface ? "page-shell-unified-surface dashboard-unified-shell" : "max-w-6xl"
        }`}
      >
        <div className="page-shell-heading flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          </div>

          {actions ? <div className="page-shell-actions">{actions}</div> : null}
        </div>

        {children}
      </div>
    </main>
  );
}
