// One bounty in a grid: title, status, prize pool, your role, prizes decided and the next date.
// The whole card links to the bounty's detail page.

import Link from "next/link";
import type { Address } from "@solana/kit";
import { Clock, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import TokenAmount from "@/components/common/TokenAmount";
import BountyStatusBadge from "./BountyStatusBadge";
import RoleBadges from "./RoleBadges";
import type { EscrowAccount } from "@/types/escrow";
import { formatDeadline, formatSpan, totalLocked } from "@/utils/format";
import { BountyStatus, countDecidedTiers, getBountyStatus } from "@/utils/status";
import { getViewerRoles } from "@/utils/roles";
import { cn } from "@/lib/utils";

interface Props {
  escrow: EscrowAccount;
  viewer: Address | null; // connected wallet, used to show your role
}

// "in 3 days", or "now" when under a minute is left
function timeUntil(unixSeconds: bigint): string {
  const seconds = Math.max(0, Number(unixSeconds) - Math.floor(Date.now() / 1000));
  const span = formatSpan(seconds);
  return span ? `in ${span}` : "now";
}

// The date that matters next: entries closing, judging ending, or when it ended
function nextDateText(escrow: EscrowAccount, status: BountyStatus): string {
  if (status === "open" || status === "ending-soon") return `Entries close ${timeUntil(escrow.submissionsDeadline)}`;
  if (status === "judging") return `Judging ends ${timeUntil(escrow.deadline)}`;
  return formatDeadline(escrow.deadline);
}

export default function BountyCard({ escrow, viewer }: Props) {
  const status = getBountyStatus(escrow);
  const roles = getViewerRoles(escrow, viewer);
  const decided = countDecidedTiers(escrow.tiers);
  const prizeCount = escrow.tiers.length;

  return (
    <Link
      href={`/bounty/${escrow.address}`}
      className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card
        className={cn(
          "h-full gap-4 px-5 py-5 transition-shadow duration-200 group-hover:ring-primary/50",
          roles.isOrganizer && "shadow-glow ring-primary/40"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-display text-lg leading-snug">{escrow.title}</h3>
          <BountyStatusBadge status={status} />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prize pool
          </span>
          <TokenAmount amount={totalLocked(escrow.tiers)} className="text-3xl" />
        </div>

        <RoleBadges roles={roles} />

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="size-4" aria-hidden />
            {decided} of {prizeCount} {prizeCount === 1 ? "prize" : "prizes"} decided
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            {nextDateText(escrow, status)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
