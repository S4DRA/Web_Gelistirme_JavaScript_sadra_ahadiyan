import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Navbar } from "@/components/navbar";
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
  description: "Track cash flow, invoices, and financial health.",
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

const themeInitScript = `
(() => {
  try {
    const theme = localStorage.getItem("dampener-theme") || "default";
    const mode = localStorage.getItem("dampener-mode") || "light";
    const contrast = localStorage.getItem("dampener-contrast") || "modern";
    const financeType = localStorage.getItem("dampener-finance-type") || "business";
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;
    document.documentElement.dataset.contrast = contrast;
    document.documentElement.dataset.financeType = financeType;
  } catch {}
})();
`;

export default function SystemLayout({
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
      data-finance-type="business"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <Script
          id="dampener-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
