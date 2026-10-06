"use client";

// Top bar on every page: logo, main navigation, "Create bounty" and the wallet menu.
// Below md the navigation moves into MobileNav.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MobileNav from "./MobileNav";
import WalletButton from "./WalletButton";
import { NAV_LINKS, isActivePath } from "./navLinks";

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-6 sm:px-6">
        <MobileNav />

        <Link href="/" aria-label="OpenBounty home" className="flex items-center gap-2.5">
          <Image src="/icon.png" alt="" width={32} height={32} className="rounded-md" priority />
          <span className="hidden font-display text-xl sm:inline">OpenBounty</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active && "bg-accent text-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/create">
              <Plus /> Create bounty
            </Link>
          </Button>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
