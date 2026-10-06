import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import "./globals.css";

// Fonts are exposed as CSS variables and mapped to Tailwind in globals.css:
// font-sans (DM Sans), font-display (DM Serif Display), font-mono (JetBrains Mono)
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

// Pages set their own title; it becomes "Create a bounty · OpenBounty"
export const metadata: Metadata = {
  title: { default: "OpenBounty · Trustless bounties on Solana", template: "%s · OpenBounty" },
  description: "Lock a prize pool on Solana. Judges vote on winners, and winners claim directly.",
};

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  // Font variables sit on <html> so every CSS variable in globals.css can use them.
  // "dark" is always on: the app has a single dark theme.
  const htmlClasses = cn("dark", dmSans.variable, dmSerif.variable, jetbrainsMono.variable);

  return (
    <html lang="en" className={htmlClasses}>
      <body className="flex flex-col">
        <Providers>
          <TooltipProvider>
            {/* First thing keyboard users reach: jumps past the header */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
              {children}
            </main>
            <SiteFooter />
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
