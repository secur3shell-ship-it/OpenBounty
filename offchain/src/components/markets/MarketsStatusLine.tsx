// The line above the Markets cards: how fresh the prices are, who they come from, how
// often they refresh, and a calm note when a refresh fails (the last prices stay).

import UpdatedAgo from "./UpdatedAgo";
import type { FeedStatus, PriceSource } from "@/types/market";
import type { MarketDataMode } from "@/lib/marketData";

interface Props {
  status: FeedStatus;
  updatedAt: Date | null;
  source: PriceSource | null;
  hasQuotes: boolean;
  mode: MarketDataMode;
}

export default function MarketsStatusLine({ status, updatedAt, source, hasQuotes, mode }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <UpdatedAgo date={updatedAt} />
      {source && (
        <span>
          Price data from{" "}
          <a href={source.url} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
            {source.name}
          </a>
        </span>
      )}
      {mode === "browser" && <span>Refreshes every minute</span>}
      {status === "reconnecting" && hasQuotes && mode === "feed" && (
        <span role="status" className="text-destructive">Live updates paused. Reconnecting, showing the last prices.</span>
      )}
      {status === "reconnecting" && hasQuotes && mode === "browser" && (
        <span role="status" className="text-destructive">Couldn&apos;t refresh. Showing the last prices; trying again next minute.</span>
      )}
    </div>
  );
}
