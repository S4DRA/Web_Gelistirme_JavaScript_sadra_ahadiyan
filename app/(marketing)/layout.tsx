import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
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

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-black">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-100 bg-white">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
              <Link
                href="/"
                className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-black"
              >
                <Image src="/img/1.svg" alt="" width={32} height={32} className="h-8 w-8" />
                Dampener
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-black transition hover:border-emerald-300 hover:text-emerald-700"
              >
                Login
              </Link>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
