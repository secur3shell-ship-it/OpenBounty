// Badge with a prize tier's status: Awaiting votes, Voting · 2 of 3, Winner picked, Claimed,
// No winner (voting closed first), Unclaimed (the claim window closed) or Refunded.

import { Badge } from "@/components/ui/badge";
import type { TierProgress } from "@/utils/status";

interface Props {
  progress: TierProgress;
  threshold: number;
}

export default function TierStatusBadge({ progress, threshold }: Props) {
  switch (progress.status) {
    case "claimed":
      return <Badge variant="outline" className="border-success/40 text-success">Claimed</Badge>;
    case "winner":
      return <Badge variant="outline" className="border-primary/60 text-accent-foreground">Winner picked</Badge>;
    case "unclaimed":
      return <Badge variant="outline" className="text-muted-foreground">Unclaimed</Badge>;
    case "refunded":
      return <Badge variant="outline" className="text-muted-foreground">Refunded</Badge>;
    case "no-winner":
      return <Badge variant="outline" className="text-muted-foreground">No winner</Badge>;
    case "voting":
      return <Badge variant="outline">Voting · {progress.leadingVotes} of {threshold}</Badge>;
    default:
      return <Badge variant="outline" className="text-muted-foreground">Awaiting votes</Badge>;
  }
}
