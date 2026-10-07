"use client";

// Price, 24h change and 7-day sparkline for every Markets token, from lib/marketData
// (CoinGecko every minute today; the parked live feed when it's configured). Updates
// replace numbers in place, and after a failed refresh the last prices stay on screen
// until fresh ones arrive (no skeleton flash).

import { useSyncExternalStore } from "react";
import {
  getInitialMarketsState,
  getMarketsState,
  MARKET_DATA_MODE,
  refreshMarkets,
  subscribeMarkets,
} from "@/lib/marketData";

export function useMarketQuotes() {
  const feed = useSyncExternalStore(subscribeMarkets, getMarketsState, getInitialMarketsState);
  const hasQuotes = feed.quotes.length > 0;

  return {
    quotes: feed.quotes,
    status: feed.status,
    mode: MARKET_DATA_MODE,
    updatedAt: feed.updatedAt,
    source: feed.source,
    // Only the very first connection shows a loading state
    loading: feed.status === "connecting" && !hasQuotes && feed.error === null,
    error: feed.error,
    refetch: refreshMarkets,
  };
}
