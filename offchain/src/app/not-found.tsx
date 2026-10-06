// 404 page for any unknown URL.

import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="This page doesn't exist or has moved."
      action={
        <Button asChild>
          <Link href="/">Explore bounties</Link>
        </Button>
      }
    />
  );
}
