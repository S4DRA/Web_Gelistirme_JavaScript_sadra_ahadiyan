import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/invoices", label: "Invoices" },
];

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Dampener
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
