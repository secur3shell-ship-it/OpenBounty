// Side panel on the bounty detail page: prize pool, the three dates (entries close,
// judging ends, claim window), judges, organizer and links.

import type { Address as SolanaAddress } from "@solana/kit";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Address from "@/components/common/Address";
import TokenAmount from "@/components/common/TokenAmount";
import type { EscrowAccount } from "@/types/escrow";
import {
  claimWindowDays,
  formatDate,
  formatDeadline,
  formatSol,
  totalLocked,
  unsettledTotal,
} from "@/utils/format";
import { safeDetailsUrl } from "@/utils/address";

const LABEL = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

interface Props {
  escrow: EscrowAccount;
  viewer: SolanaAddress | null;
}

export default function BountyDetailsPanel({ escrow, viewer }: Props) {
  const detailsUrl = safeDetailsUrl(escrow.metadataUri);
  const windowDays = claimWindowDays(escrow.deadline, escrow.claimDeadline);

  return (
    <Card className="gap-5 px-5 py-5">
      <div className="flex flex-col gap-1">
        <span className={LABEL}>Prize pool</span>
        <TokenAmount amount={totalLocked(escrow.tiers)} className="text-2xl" />
        <span className="text-sm text-muted-foreground">{formatSol(unsettledTotal(escrow.tiers))} still locked</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className={LABEL}>Entries close</span>
        <span>{formatDeadline(escrow.submissionsDeadline, "Closed")}</span>
        <span className="text-sm text-muted-foreground">{formatDate(escrow.submissionsDeadline)}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className={LABEL}>Judging ends</span>
        <span>{formatDeadline(escrow.deadline)}</span>
        <span className="text-sm text-muted-foreground">{formatDate(escrow.deadline)}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className={LABEL}>Claim window</span>
        <span>
          {windowDays} {windowDays === 1 ? "day" : "days"} · until {formatDate(escrow.claimDeadline)}
        </span>
        <span className="text-sm text-muted-foreground">
          Winners must claim by then. After it, the organizer can refund unclaimed prizes.
        </span>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <span className={LABEL}>
          Judges · {escrow.threshold} of {escrow.judges.length} votes to win
        </span>
        {escrow.judges.map((judge) => (
          <Address key={judge} address={judge} isYou={judge === viewer} />
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <span className={LABEL}>Organizer</span>
        <Address address={escrow.organizer} isYou={escrow.organizer === viewer} />
      </div>

      <div className="flex flex-col gap-1">
        <span className={LABEL}>Escrow account</span>
        <Address address={escrow.address} />
      </div>

      {detailsUrl && (
        <a
          href={detailsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
        >
          Read the full brief <ExternalLink className="size-4" aria-hidden />
        </a>
      )}
    </Card>
  );
}
