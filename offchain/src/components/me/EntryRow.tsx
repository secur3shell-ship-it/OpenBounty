// One of your entries on "Your bounties": its name, the bounty and how it's doing,
// and "Close entry" once judging has ended (the rent comes back to you).

import Link from "next/link";
import type { Address } from "@solana/kit";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MyEntry } from "@/hooks/useMyEntries";
import { formatDate, formatTimeAgo, placeLabel } from "@/utils/format";
import { getBountyStatus, nowSeconds } from "@/utils/status";
import { wonTiers } from "@/utils/submissions";

interface Props {
  entry: MyEntry;
  viewer: Address;
  rentText: string | null;   // e.g. "0.0046 SOL"
  closing: boolean;
  onClose: () => void;
}

const STATUS_TEXT = {
  "open": "Entries open",
  "ending-soon": "Entries closing soon",
  "judging": "Judging",
  "ended": "Judging ended",
} as const;

export default function EntryRow({ entry, viewer, rentText, closing, onClose }: Props) {
  const { bounty } = entry;
  const canClose = nowSeconds() > entry.closeAfter;
  const won = bounty ? wonTiers(bounty, viewer) : [];

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-medium">{entry.title}</span>
        <span className="text-sm text-muted-foreground">
          {bounty ? (
            <Link href={`/bounty/${bounty.address}`} className="underline-offset-4 hover:underline">
              {bounty.title}
            </Link>
          ) : (
            "Bounty closed"
          )}
          {" · "}Entered {formatTimeAgo(entry.submittedAt)}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {bounty && <Badge variant="outline">{STATUS_TEXT[getBountyStatus(bounty)]}</Badge>}
          {won.map((tier) => (
            <Badge key={tier} variant="outline" className="border-success/40 text-success">
              Won {placeLabel(tier)}
            </Badge>
          ))}
        </div>
      </div>

      {canClose ? (
        <Button variant="outline" onClick={onClose} disabled={closing} className="shrink-0">
          {closing && <Loader2 className="animate-spin" />}
          {closing ? "Confirming..." : `Close entry${rentText ? `, get ${rentText} back` : ""}`}
        </Button>
      ) : (
        <span className="shrink-0 text-sm text-muted-foreground">
          Can be closed after {formatDate(entry.closeAfter)}
        </span>
      )}
    </li>
  );
}
