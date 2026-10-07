// Where market prices and news come from. Today: straight from the browser (CoinGecko
// for prices, refreshed every minute; Solana's RSS for news). The real-time backend
// (lib/marketFeed.ts, docs/features/markets-feed.md) is parked: setting
// NEXT_PUBLIC_MARKET_FEED_URL switches everything over to it with no other change.

import type { MarketId } from "@/constants/markets";
import type { ChartRange, PricePoint } from "@/types/market";
import type { NewsFeedData } from "@/types/news";
import {
  fetchNews as fetchFeedNews,
  fetchPriceHistory as fetchFeedHistory,
  getInitialMarketFeedState,
  getMarketFeedState,
  MARKET_FEED_URL,
  reconnectMarketFeed,
  subscribeMarketFeed,
  type MarketFeedState,
} from "@/lib/marketFeed";
import { fetchCoinGeckoHistory } from "@/lib/coingecko";
import { getInitialPollingState, getPollingState, refreshPolling, subscribePolling } from "@/lib/marketPolling";
import { fetchSolanaNews } from "@/lib/solanaNews";

export type MarketDataMode = "feed" | "browser";

export const MARKET_DATA_MODE: MarketDataMode = MARKET_FEED_URL ? "feed" : "browser";
const useFeed = MARKET_DATA_MODE === "feed";

export type MarketsState = MarketFeedState;

export const subscribeMarkets: (listener: () => void) => () => void = useFeed ? subscribeMarketFeed : subscribePolling;
export const getMarketsState: () => MarketsState = useFeed ? getMarketFeedState : getPollingState;
export const getInitialMarketsState: () => MarketsState = useFeed ? getInitialMarketFeedState : getInitialPollingState;
export const refreshMarkets: () => void = useFeed ? reconnectMarketFeed : refreshPolling;

export function fetchPriceHistory(id: MarketId, range: ChartRange): Promise<PricePoint[]> {
  return useFeed ? fetchFeedHistory(id, range) : fetchCoinGeckoHistory(id, range);
}

export function fetchNews(): Promise<NewsFeedData> {
  return useFeed ? fetchFeedNews() : fetchSolanaNews();
}
