// Client for our read-only market feed (contract: docs/features/markets-feed.md).
// Live prices arrive over one shared socket.io connection that the server pushes to;
// the browser never polls. Chart history and news are plain GET requests.
//
// The socket opens when the first component subscribes and closes a few seconds after
// the last one leaves. The latest prices are kept here, so coming back to the page shows
// them at once while a fresh snapshot arrives.

import { io, type Socket } from "socket.io-client";
import { MARKET_ASSETS, type MarketId } from "@/constants/markets";
import type { ChartRange, FeedStatus, MarketQuote, PricePoint, PriceSource } from "@/types/market";
import type { NewsFeedData, NewsItem } from "@/types/news";

// Origin of the feed, e.g. "http://localhost:4000". Null = not configured.
export const MARKET_FEED_URL: string | null = cleanBaseUrl(process.env.NEXT_PUBLIC_MARKET_FEED_URL);

function cleanBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  return trimmed ? trimmed : null;
}

// ---------------------------------------------------------------------------
// Wire format (what the server sends)

interface WireQuote {
  price: number;
  change24h: number | null;
  sparkline7d: number[];      // hourly USD prices for the last 7 days, oldest first;
                              // the last one is for the start of the current hour
}

interface SnapshotEvent {
  updatedAt: string;
  source?: PriceSource;
  quotes: Partial<Record<MarketId, WireQuote>>;
}

interface QuoteEvent {
  id: MarketId;
  price: number;
  change24h: number | null;
  at: string;
}

interface ServerToClientEvents {
  snapshot: (data: SnapshotEvent) => void;
  quote: (data: QuoteEvent) => void;
}

// Read-only: the browser never sends anything
type ClientToServerEvents = Record<string, never>;

// ---------------------------------------------------------------------------
// Live prices: a tiny store that React reads with useSyncExternalStore

export interface MarketFeedState {
  status: FeedStatus;
  quotes: MarketQuote[];        // in MARKET_ASSETS order
  updatedAt: Date | null;       // newest price time across all tokens
  source: PriceSource | null;
  error: string | null;         // set when the connection fails
}

const CLOSE_DELAY_MS = 5_000;   // keep the socket a moment so quick navigation doesn't reconnect

const INITIAL_STATE: MarketFeedState = {
  status: MARKET_FEED_URL ? "connecting" : "off",
  quotes: [],
  updatedAt: null,
  source: null,
  error: null,
};

const HOUR_MS = 60 * 60 * 1000;

let state: MarketFeedState = INITIAL_STATE;
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function setState(patch: Partial<MarketFeedState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function getMarketFeedState(): MarketFeedState {
  return state;
}

// What the server renders (and the first client render, so hydration matches)
export function getInitialMarketFeedState(): MarketFeedState {
  return INITIAL_STATE;
}

export function subscribeMarketFeed(listener: () => void): () => void {
  listeners.add(listener);
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  openSocket();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && !closeTimer) {
      closeTimer = setTimeout(closeSocket, CLOSE_DELAY_MS);
    }
  };
}

// "Try again": reconnect now instead of waiting for the next automatic attempt
export function reconnectMarketFeed() {
  if (!socket) return;
  socket.disconnect();
  setState({ status: waitingStatus(), error: null });
  socket.connect();
}

function waitingStatus(): FeedStatus {
  return state.quotes.length > 0 ? "reconnecting" : "connecting";
}

function openSocket() {
  if (!MARKET_FEED_URL || socket) return;

  // WebSocket only: no long-polling fallback, so the server needs no sticky sessions
  socket = io(`${MARKET_FEED_URL}/markets`, { transports: ["websocket"] });

  socket.on("snapshot", (data) => {
    const parsed = parseSnapshot(data);
    if (!parsed) return;
    setState({ status: "live", error: null, ...parsed });
  });

  socket.on("quote", (data) => applyQuote(data));

  socket.on("disconnect", (reason) => {
    if (reason === "io client disconnect") return;   // we closed it on purpose
    setState({ status: waitingStatus() });
    // The server closed it on purpose (e.g. a restart); socket.io won't retry by itself
    if (reason === "io server disconnect") socket?.connect();
  });

  socket.on("connect_error", () => {
    setState({
      status: waitingStatus(),
      error: "Couldn't reach the live price feed. It keeps trying in the background.",
    });
  });
}

function closeSocket() {
  closeTimer = null;
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  // Keep the last prices for the next visit; a fresh snapshot replaces them
  setState({ status: waitingStatus(), error: null });
}

function isPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function toChange(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toSource(value: unknown): PriceSource | null {
  if (!value || typeof value !== "object") return null;
  const { name, url } = value as Partial<PriceSource>;
  if (typeof name !== "string" || typeof url !== "string" || !/^https?:\/\//.test(url)) return null;
  return { name, url };
}

// Turns a snapshot into quotes, skipping anything malformed. Null if it's unusable.
function parseSnapshot(data: unknown): Pick<MarketFeedState, "quotes" | "updatedAt" | "source"> | null {
  if (!data || typeof data !== "object") return null;
  const snapshot = data as Partial<SnapshotEvent>;
  if (!snapshot.quotes || typeof snapshot.quotes !== "object") return null;
  const updatedAt = toDate(snapshot.updatedAt) ?? new Date();
  const sparklineEndsAt = new Date(Math.floor(updatedAt.getTime() / HOUR_MS) * HOUR_MS);

  const quotes: MarketQuote[] = [];
  for (const asset of MARKET_ASSETS) {
    const wire = snapshot.quotes[asset.id];
    if (!wire || !isPrice(wire.price)) continue;
    const sparkline = Array.isArray(wire.sparkline7d) ? wire.sparkline7d.filter(isPrice) : [];
    quotes.push({
      id: asset.id,
      priceUsd: wire.price,
      change24h: toChange(wire.change24h),
      sparkline,
      sparklineEndsAt,
      updatedAt,
    });
  }
  return { quotes, updatedAt, source: toSource(snapshot.source) };
}

// One live price: replaces that token's price and 24h change, keeps its sparkline
function applyQuote(data: unknown) {
  if (!data || typeof data !== "object") return;
  const event = data as Partial<QuoteEvent>;
  const asset = MARKET_ASSETS.find((a) => a.id === event.id);
  const at = toDate(event.at);
  if (!asset || !at || !isPrice(event.price)) return;

  const existing = state.quotes.find((q) => q.id === asset.id);
  if (existing && at < existing.updatedAt) return;   // arrived out of order

  const next: MarketQuote = {
    id: asset.id,
    priceUsd: event.price,
    change24h: toChange(event.change24h),
    sparkline: existing ? existing.sparkline : [],
    sparklineEndsAt: existing ? existing.sparklineEndsAt : at,
    updatedAt: at,
  };
  const quotes = MARKET_ASSETS
    .map((a) => (a.id === asset.id ? next : state.quotes.find((q) => q.id === a.id)))
    .filter((q): q is MarketQuote => q !== undefined);
  const updatedAt = state.updatedAt && state.updatedAt > at ? state.updatedAt : at;
  setState({ quotes, updatedAt });
}

// ---------------------------------------------------------------------------
// REST: chart history and news

const REQUEST_TIMEOUT_MS = 10_000;
const HISTORY_CACHE_MS: Record<ChartRange, number> = { "1H": 30_000, "24H": 60_000, "7D": 5 * 60_000, "30D": 5 * 60_000 };
const NEWS_CACHE_MS = 5 * 60_000;

const cache = new Map<string, { at: number; data: unknown }>();

async function getJson(path: string, cacheMs: number): Promise<unknown> {
  if (!MARKET_FEED_URL) throw new Error("Live prices aren't connected yet.");

  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < cacheMs) return hit.data;

  let response: Response;
  try {
    response = await fetch(`${MARKET_FEED_URL}${path}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    throw new Error("Couldn't reach the price feed. Check your connection and try again.");
  }
  if (response.status === 429) throw new Error("The price feed is busy. Try again in a minute.");
  if (response.status === 400 || response.status === 404) throw new Error("This data isn't available right now.");
  if (!response.ok) throw new Error(`The price feed returned an error (${response.status}). Try again in a minute.`);

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("The price feed sent something we couldn't read.");
  }
  cache.set(path, { at: Date.now(), data });
  return data;
}

// Price history for one token and range, oldest first
export async function fetchPriceHistory(id: MarketId, range: ChartRange): Promise<PricePoint[]> {
  const data = await getJson(`/markets/history?id=${encodeURIComponent(id)}&range=${range}`, HISTORY_CACHE_MS[range]);
  const raw = (data as { points?: unknown } | null)?.points;
  if (!Array.isArray(raw)) throw new Error("The price feed sent something we couldn't read.");

  const points: PricePoint[] = [];
  for (const row of raw) {
    if (Array.isArray(row) && Number.isFinite(row[0]) && isPrice(row[1])) {
      points.push({ time: row[0], price: row[1] });
    }
  }
  return points.sort((a, b) => a.time - b.time);
}

function toNewsItem(value: unknown): NewsItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const publishedAt = toDate(item.publishedAt);
  const { id, title, summary, url, source } = item;
  if (typeof id !== "string" || typeof title !== "string" || typeof url !== "string" || !publishedAt) return null;
  // Only real web links: never javascript: or other schemes from a remote server
  if (!/^https?:\/\//.test(url)) return null;
  return {
    id,
    title,
    summary: typeof summary === "string" ? summary : "",
    url,
    source: typeof source === "string" ? source : "",
    publishedAt,
  };
}

// Latest news from around Solana, newest first
export async function fetchNews(): Promise<NewsFeedData> {
  const data = (await getJson("/news", NEWS_CACHE_MS)) as { items?: unknown; isSample?: unknown } | null;
  if (!data || !Array.isArray(data.items)) throw new Error("The news feed sent something we couldn't read.");

  const items = data.items
    .map(toNewsItem)
    .filter((item): item is NewsItem => item !== null)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return { items, isSample: data.isSample === true };
}
