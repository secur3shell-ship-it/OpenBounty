// One to-do item on "Your bounties": which bounty and prize, with a button to its page.

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  href: string;
  title: string;
  detail: string;
  actionLabel: string;
}

export default function TaskRow({ href, title, detail, actionLabel }: Props) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{detail}</span>
      </div>
      <Button asChild variant="outline">
        <Link href={href}>{actionLabel}</Link>
      </Button>
    </li>
  );
}
