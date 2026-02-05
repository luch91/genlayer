import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import { WalletConnect } from "@/components/WalletConnect";

export const metadata: Metadata = {
  title: "Prompt Duel - GenLayer Mini-Game",
  description:
    "Compete to craft the best AI prompts. Scored by LLM consensus on GenLayer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
              <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary-700">
                    Prompt Duel
                  </span>
                  <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                    GenLayer
                  </span>
                </Link>
                <nav className="flex items-center gap-4">
                  <Link
                    href="/leaderboard"
                    className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    Leaderboard
                  </Link>
                  <WalletConnect />
                </nav>
              </div>
            </header>
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
              {children}
            </main>
            <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
              Built on GenLayer &middot; Powered by Intelligent Contracts &amp;
              Optimistic Democracy
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
