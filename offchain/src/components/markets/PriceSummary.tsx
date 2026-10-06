// Text version of a price chart (start, high, low, now, change) so every number is
// readable without hovering the chart.

import type { PricePoint } from "@/types/market";
import { formatPercent, formatUsd } from "@/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  points: PricePoint[];
}

export default function PriceSummary({ points }: Props) {
  if (points.length < 2) return null;

  const prices = points.map((point) => point.price);
  const start = prices[0];
  const now = prices[prices.length - 1];
  const change = ((now - start) / start) * 100;

  const items = [
    { label: "Start", value: formatUsd(start) },
    { label: "High", value: formatUsd(Math.max(...prices)) },
    { label: "Low", value: formatUsd(Math.min(...prices)) },
    { label: "Now", value: formatUsd(now) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</dt>
          <dd className="tabular-nums">{item.value}</dd>
        </div>
      ))}
      <div className="flex flex-col">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Change</dt>
        <dd className={cn("tabular-nums", change >= 0 ? "text-success" : "text-destructive")}>
          {formatPercent(change)}
        </dd>
      </div>
    </dl>
  );
}
