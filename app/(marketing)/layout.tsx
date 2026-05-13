import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { LandingThemeToggle } from "@/components/landing-theme-toggle";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dampener",
  description: "Cash-flow intelligence for freelancers, small teams, and small businesses.",
  icons: {
    icon: "/img/1.svg",
    shortcut: "/img/1.svg",
    apple: "/img/1.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const landingThemeInitScript = `
(() => {
  try {
    const savedTheme = localStorage.getItem("dampener-landing-theme");
    const theme = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : "light";
    document.documentElement.dataset.landingTheme = theme;
  } catch {}
})();
`;

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="default"
      data-mode="light"
      data-contrast="modern"
      data-landing-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-black">
        <Script
          id="dampener-landing-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: landingThemeInitScript }}
        />
        <div className="marketing-shell flex min-h-screen flex-col overflow-x-hidden">
          <header className="marketing-header border-b border-slate-100 bg-white">
            <div className="marketing-header-inner mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6 sm:py-4">
              <Link
                href="/"
                className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-black"
              >
                <Image src="/img/1.svg" alt="" width={32} height={32} className="landing-brand-logo h-8 w-8" />
                Dampener
              </Link>
              <div className="marketing-theme-actions flex items-center gap-2">
                <LandingThemeToggle />
                <Link
                  href="/request-access"
                  className="marketing-access-link inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100 sm:px-5"
                >
                  Request Access
                </Link>
                <Link
                  href="/login"
                  className="marketing-login-link inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:border-emerald-300 hover:text-emerald-700 sm:px-5"
                >
                  Login
                </Link>
              </div>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
