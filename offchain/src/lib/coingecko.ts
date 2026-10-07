// Market data straight from CoinGecko's free public API, called by the browser (no key,
// no server of ours). One request gives every token's price, 24h change and 7 days of
// hourly prices; 1H and 30D charts make their own request. Replies are cached so a busy
// page stays well inside the free rate limit.

import { MARKET_IDS, type MarketId } from "@/constants/markets";
import type { ChartRange, MarketQuote, PricePoint, PriceSource } from "@/types/market";

const API = "https://api.coingecko.com/api/v3";
const TIMEOUT_MS = 10_000;
const HOUR_MS = 60 * 60 * 1000;

export const COINGECKO_SOURCE: PriceSource = { name: "CoinGecko", url: "https://www.coingecko.com" };

const COINGECKO_IDS: Record<MarketId, string> = {
  SOL: "solana",
  USDC: "usd-coin",
  USDT: "tether",
  BONK: "bonk",
  JUP: "jupiter-exchange-solana",
  BTC: "bitcoin",
  ETH: "ethereum",
};

// The free API answers a rate-limited request without a CORS header, so the browser
// reports it as a network error. Both cases get the same calm message.
const BUSY = "CoinGecko's free price service is busy. Try again in a minute.";

async function getJson(path: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new Error(BUSY);
  }
  if (response.status === 429) throw new Error(BUSY);
  if (!response.ok) throw new Error(`The price service returned an error (${response.status}). Try again in a minute.`);
  try {
    return await response.json();
  } catch {
    throw new Error("The price service sent something we couldn't read.");
  }
}

function isPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

interface CoinRow {
  id?: unknown;
  current_price?: unknown;
  price_change_percentage_24h?: unknown;
  last_updated?: unknown;
  sparkline_in_7d?: { price?: unknown };
}

/** Every Markets token's price, 24h change and 7-day hourly prices, in one request. */
export async function fetchCoinGeckoQuotes(): Promise<MarketQuote[]> {
  const ids = MARKET_IDS.map((id) => COINGECKO_IDS[id]).join(",");
  const rows = await getJson(
    `/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h&precision=full`
  );
  if (!Array.isArray(rows)) throw new Error("The price service sent something we couldn't read.");

  const quotes: MarketQuote[] = [];
  for (const id of MARKET_IDS) {
    const row = (rows as CoinRow[]).find((r) => r.id === COINGECKO_IDS[id]);
    if (!row || !isPrice(row.current_price)) continue;
    const updated = typeof row.last_updated === "string" ? new Date(row.last_updated) : new Date();
    const updatedAt = Number.isNaN(updated.getTime()) ? new Date() : updated;
    const sparkline = Array.isArray(row.sparkline_in_7d?.price) ? row.sparkline_in_7d.price.filter(isPrice) : [];
    const change = row.price_change_percentage_24h;
    quotes.push({
      id,
      priceUsd: row.current_price,
      change24h: typeof change === "number" && Number.isFinite(change) ? change : null,
      sparkline,
      // CoinGecko's hourly points end at the latest full hour
      sparklineEndsAt: new Date(Math.floor(updatedAt.getTime() / HOUR_MS) * HOUR_MS),
      updatedAt,
    });
  }
  if (quotes.length === 0) throw new Error("The price service sent no prices.");
  return quotes;
}

// days=1 gives ~5-minute points (enough for 1H and 24H); 7 and 30 give hourly points
const RANGE_DAYS: Record<ChartRange, number> = { "1H": 1, "24H": 1, "7D": 7, "30D": 30 };
const RANGE_MS: Record<ChartRange, number> = { "1H": HOUR_MS, "24H": 24 * HOUR_MS, "7D": 7 * 24 * HOUR_MS, "30D": 30 * 24 * HOUR_MS };
const CACHE_MS: Record<ChartRange, number> = { "1H": 60_000, "24H": 5 * 60_000, "7D": 5 * 60_000, "30D": 5 * 60_000 };
const historyCache = new Map<string, { at: number; points: Promise<PricePoint[]> }>();

/** Price history for one token and range, oldest first. Cached briefly. */
export function fetchCoinGeckoHistory(id: MarketId, range: ChartRange): Promise<PricePoint[]> {
  const key = `${id}:${range}`;
  const cached = historyCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS[range]) return cached.points;

  const points = getJson(`/coins/${COINGECKO_IDS[id]}/market_chart?vs_currency=usd&days=${RANGE_DAYS[range]}`).then((data) => {
    const prices = (data as { prices?: unknown }).prices;
    if (!Array.isArray(prices)) throw new Error("The price service sent something we couldn't read.");
    const all = prices
      .filter((p): p is [number, number] => Array.isArray(p) && typeof p[0] === "number" && isPrice(p[1]))
      .map(([time, price]) => ({ time, price }));
    const since = (all[all.length - 1]?.time ?? Date.now()) - RANGE_MS[range];
    return all.filter((point) => point.time >= since);
  });
  historyCache.set(key, { at: Date.now(), points });
  points.catch(() => historyCache.delete(key));
  return points;
}
