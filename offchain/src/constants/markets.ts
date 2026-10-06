// Tokens on the Markets page: the Solana tokens OpenBounty knows about, plus BTC and ETH
// as reference points. Prices come from our own read-only market feed
// (see docs/features/markets-feed.md); the browser never calls a price service itself.

import type { AssetId } from "./assets";

export type MarketId = AssetId | "BTC" | "ETH";

export interface MarketAsset {
  id: MarketId;
  name: string;
  onSolana: boolean;    // false = shown for reference only (BTC, ETH)
}

export const MARKET_ASSETS: MarketAsset[] = [
  { id: "SOL",  name: "Solana",     onSolana: true },
  { id: "USDC", name: "USD Coin",   onSolana: true },
  { id: "USDT", name: "Tether USD", onSolana: true },
  { id: "BONK", name: "Bonk",       onSolana: true },
  { id: "JUP",  name: "Jupiter",    onSolana: true },
  { id: "BTC",  name: "Bitcoin",    onSolana: false },
  { id: "ETH",  name: "Ethereum",   onSolana: false },
];

export const MARKET_IDS: MarketId[] = MARKET_ASSETS.map((asset) => asset.id);
