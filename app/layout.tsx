import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Regression Whisperer",
    template: "%s — Regression Whisperer",
  },
  description: "AI-powered PR regression detection. Five agents catch N+1 queries, memory leaks, and latency spikes before they ship.",
  keywords: ["performance", "regression", "CI/CD", "profiling", "AI", "pull request"],
  openGraph: {
    title: "Regression Whisperer",
    description: "Detect regressions before they ship. Every PR gets a performance autopsy.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-6 h-12 px-6 bg-bg-primary border-b border-border-primary">
          <a
            href="/"
            className="text-sm font-semibold text-text-primary tracking-tight no-underline"
          >
            Regression Whisperer
          </a>
          <div className="flex items-center gap-4 ml-auto">
            <a
              href="/analyze"
              className="text-xs font-mono text-accent hover:text-accent/80 transition-colors no-underline"
            >
              Analyze
            </a>
            <a
              href="/pipeline"
              className="text-xs text-text-secondary hover:text-text-primary transition-colors no-underline"
            >
              Pipeline
            </a>
            <a
              href="/prs"
              className="text-xs text-text-secondary hover:text-text-primary transition-colors no-underline"
            >
              PRs
            </a>
            <a
              href="/setup"
              className="text-xs text-text-secondary hover:text-text-primary transition-colors no-underline"
            >
              Setup
            </a>
          </div>
        </nav>
        <main className="pt-12">{children}</main>
      </body>
    </html>
  );
}
