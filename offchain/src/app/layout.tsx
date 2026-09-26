import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletButton } from "@/components/WalletButton";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenBounty",
  description: "Trustless hackathon prize bounties on Solana",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <header className="flex items-center justify-between gap-4 border-b px-6 py-3">
            <Link href="/" className="font-bold">
              OpenBounty
            </Link>
            <div className="flex items-center gap-3">
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">Devnet</span>
              <WalletButton />
            </div>
          </header>
          <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
