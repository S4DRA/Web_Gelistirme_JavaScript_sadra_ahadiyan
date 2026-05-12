import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  description: "Access your Dampener cash-flow workspace.",
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
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;
    document.documentElement.dataset.contrast = contrast;
  } catch {}
})();
`;

export default function AuthLayout({
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <Script
          id="dampener-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <div className="flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
