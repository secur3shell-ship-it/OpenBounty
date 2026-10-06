// The line above the Markets cards: how fresh the prices are, who they come from, and
// a calm note while the live connection is being restored.

import UpdatedAgo from "./UpdatedAgo";
import type { FeedStatus, PriceSource } from "@/types/market";

interface Props {
  status: FeedStatus;
  updatedAt: Date | null;
  source: PriceSource | null;
  hasQuotes: boolean;
}

export default function MarketsStatusLine({ status, updatedAt, source, hasQuotes }: Props) {
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
      {status === "reconnecting" && hasQuotes && (
        <span role="status" className="text-destructive">Live updates paused. Reconnecting, showing the last prices.</span>
      )}
    </div>
  );
}
