// A SOL amount (lamports) shown as text, e.g. "12.5 SOL", in the highlight color
// with digits that line up in lists.

import { formatSol } from "@/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  amount: bigint;
  className?: string;
}

export default function TokenAmount({ amount, className }: Props) {
  return (
    <span className={cn("font-semibold tabular-nums text-highlight", className)}>
      {formatSol(amount)}
    </span>
  );
}
