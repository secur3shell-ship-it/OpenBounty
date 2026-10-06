// One token on the Markets page: name, live price, 24h change and a 7-day sparkline.
// It's a toggle button: selecting it shows that token in the big chart.

import { Badge } from "@/components/ui/badge";
import PriceChange from "./PriceChange";
import Sparkline from "./Sparkline";
import type { MarketAsset } from "@/constants/markets";
import type { MarketQuote } from "@/types/market";
import { formatUsd } from "@/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  asset: MarketAsset;
  quote: MarketQuote;
  selected: boolean;
  onSelect: () => void;
}

export default function MarketCard({ asset, quote, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-2 rounded-xl bg-card px-4 py-4 text-left ring-1 ring-foreground/10 transition-shadow duration-200 hover:ring-primary/50",
        selected && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{asset.id}</span>
        {!asset.onSolana && <Badge variant="outline" className="text-muted-foreground">Reference</Badge>}
      </div>
      <span className="text-sm text-muted-foreground">{asset.name}</span>
      {/* Standalone number: proportional digits look better than tabular here */}
      <span className="text-xl font-semibold">{formatUsd(quote.priceUsd)}</span>
      <PriceChange percent={quote.change24h} className="text-sm" />
      <Sparkline prices={quote.sparkline} />
      <span className="sr-only">7-day trend</span>
    </button>
  );
}
