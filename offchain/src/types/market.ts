// Market data for the Markets page, as the app uses it after reading the market feed.

import type { MarketId } from "@/constants/markets";

// One token's current market numbers
export interface MarketQuote {
  id: MarketId;
  priceUsd: number;
  change24h: number | null;   // percent, e.g. -0.62; null when the feed doesn't know
  sparkline: number[];        // hourly prices for the last 7 days, oldest first
  sparklineEndsAt: Date;      // time of the last sparkline price
  updatedAt: Date;            // time of the latest live price
}

// One point on a price chart
export interface PricePoint {
  time: number;               // unix milliseconds
  price: number;              // USD
}

export type ChartRange = "1H" | "24H" | "7D" | "30D";

// Where the feed gets its prices, credited on the page
export interface PriceSource {
  name: string;
  url: string;
}

// The live connection to the market feed:
// off          = no feed configured (NEXT_PUBLIC_MARKET_FEED_URL is empty)
// connecting   = first connection, no prices yet
// live         = connected and receiving updates
// reconnecting = connection lost; the last prices stay on screen
export type FeedStatus = "off" | "connecting" | "live" | "reconnecting";
