// Browser-only price store: polls CoinGecko once a minute while the Markets page is open
// (and the tab is visible), with the same shape as the live feed's store, so the hooks and
// components don't care which one runs. A failed refresh keeps the last prices on screen.

import type { MarketFeedState } from "@/lib/marketFeed";
import { COINGECKO_SOURCE, fetchCoinGeckoQuotes } from "@/lib/coingecko";

const REFRESH_MS = 60_000;
const STOP_DELAY_MS = 5_000;   // keep polling a moment so quick navigation doesn't refetch

const INITIAL_STATE: MarketFeedState = {
  status: "connecting",
  quotes: [],
  updatedAt: null,
  source: COINGECKO_SOURCE,
  error: null,
};

let state: MarketFeedState = INITIAL_STATE;
let timer: ReturnType<typeof setInterval> | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;
let lastFetch = 0;
const listeners = new Set<() => void>();

function setState(patch: Partial<MarketFeedState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function getPollingState(): MarketFeedState {
  return state;
}

export function getInitialPollingState(): MarketFeedState {
  return INITIAL_STATE;
}

async function refresh(force = false) {
  if (inFlight) return;
  if (!force && typeof document !== "undefined" && document.hidden) return;
  if (!force && Date.now() - lastFetch < REFRESH_MS - 1_000) return;
  inFlight = true;
  lastFetch = Date.now();
  try {
    const quotes = await fetchCoinGeckoQuotes();
    const newest = Math.max(...quotes.map((q) => q.updatedAt.getTime()));
    setState({ status: "live", quotes, updatedAt: new Date(newest), error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't load prices.";
    setState({ status: state.quotes.length > 0 ? "reconnecting" : "connecting", error: message });
  } finally {
    inFlight = false;
  }
}

// The minute is counted from the last fetch, so a manual refresh doesn't make the next
// scheduled one come early (and get skipped)
function startTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => void refresh(), REFRESH_MS);
}

function onVisible() {
  if (!document.hidden) void refresh();
}

export function subscribePolling(listener: () => void): () => void {
  listeners.add(listener);
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (!timer) {
    void refresh();
    startTimer();
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && !stopTimer) {
      stopTimer = setTimeout(() => {
        stopTimer = null;
        if (timer) clearInterval(timer);
        timer = null;
        document.removeEventListener("visibilitychange", onVisible);
      }, STOP_DELAY_MS);
    }
  };
}

// "Try again": refresh now instead of waiting for the next minute
export function refreshPolling() {
  setState({ error: null });
  void refresh(true);
  if (timer) startTimer();
}
