import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>

        {children}
      </div>
    </main>
  );
}
