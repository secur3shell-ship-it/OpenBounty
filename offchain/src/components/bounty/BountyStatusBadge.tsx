// Badge with a bounty's status: Open, Ending soon, Judging or Ended. Always text, never color alone.

import { Badge } from "@/components/ui/badge";
import type { BountyStatus } from "@/utils/status";

const STATUS_STYLES: Record<BountyStatus, { label: string; className: string }> = {
  "open":        { label: "Open",        className: "border-success/40 text-success" },
  "ending-soon": { label: "Ending soon", className: "border-primary/60 text-accent-foreground" },
  "judging":     { label: "Judging",     className: "border-primary/40 bg-accent text-accent-foreground" },
  "ended":       { label: "Ended",       className: "text-muted-foreground" },
};

interface Props {
  status: BountyStatus;
}

export default function BountyStatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status];
  return (
    <Badge variant="outline" className={style.className}>
      {style.label}
    </Badge>
  );
}
