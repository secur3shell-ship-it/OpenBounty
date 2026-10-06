"use client";

// Live price, 24h change and 7-day sparkline for every Markets token, pushed by the
// market feed (no polling). Updates replace numbers in place, and after a dropped
// connection the last prices stay on screen until fresh ones arrive (no skeleton flash).

import { useSyncExternalStore } from "react";
import {
  getInitialMarketFeedState,
  getMarketFeedState,
  reconnectMarketFeed,
  subscribeMarketFeed,
} from "@/lib/marketFeed";

export function useMarketQuotes() {
  const feed = useSyncExternalStore(subscribeMarketFeed, getMarketFeedState, getInitialMarketFeedState);
  const hasQuotes = feed.quotes.length > 0;

  return {
    quotes: feed.quotes,
    status: feed.status,
    updatedAt: feed.updatedAt,
    source: feed.source,
    // Only the very first connection shows a loading state
    loading: feed.status === "connecting" && !hasQuotes && feed.error === null,
    error: feed.error,
    refetch: reconnectMarketFeed,
  };
}
