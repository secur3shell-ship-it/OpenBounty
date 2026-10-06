"use client";

// Phone-size navigation: a menu button (hidden from md up) that opens the links in a side sheet.

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_LINKS, isActivePath } from "./navLinks";

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">OpenBounty</SheetTitle>
        </SheetHeader>

        <nav aria-label="Main" className="flex flex-col gap-1 px-4">
          {NAV_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-3 font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active && "bg-accent text-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}

          <Button asChild className="mt-4">
            <Link href="/create" onClick={close}>
              <Plus /> Create bounty
            </Link>
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
