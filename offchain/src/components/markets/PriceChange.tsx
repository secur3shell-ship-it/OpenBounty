// A price change like "+2.26%" with an up or down arrow. Green or red, but the arrow
// and the sign carry the meaning too, so it never relies on color alone.

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatPercent } from "@/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  percent: number | null;
  className?: string;
}

export default function PriceChange({ percent, className }: Props) {
  if (percent === null) {
    return <span className={cn("text-muted-foreground", className)}>-</span>;
  }

  const up = percent >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5", up ? "text-success" : "text-destructive", className)}>
      <Icon className="size-4" aria-hidden />
      {formatPercent(percent)}
    </span>
  );
}
