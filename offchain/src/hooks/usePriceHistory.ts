"use client";

// Fetched price history for one token and range (only used for 1H and 30D; 24H and 7D
// come from the live quotes). While a new choice loads, the previous chart stays up
// (the page dims it), and `shownId`/`shownRange` say what those points actually are.

import { useCallback, useEffect, useState } from "react";
import type { MarketId } from "@/constants/markets";
import type { ChartRange, PricePoint } from "@/types/market";
import { fetchPriceHistory } from "@/lib/marketData";

interface Loaded {
  id: MarketId;
  range: ChartRange;
  points: PricePoint[];
}

interface Failed {
  id: MarketId;
  range: ChartRange;
  tick: number;
  message: string;
}

export function usePriceHistory(id: MarketId, range: ChartRange, enabled: boolean) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState<Failed | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    fetchPriceHistory(id, range)
      .then((points) => {
        if (!cancelled) setLoaded({ id, range, points });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Couldn't load the chart.";
        if (!cancelled) setFailed({ id, range, tick, message });
      });

    return () => { cancelled = true; };
  }, [id, range, enabled, tick]);

  // An error only counts for the current choice and attempt, so Retry or a new range clears it
  const error = enabled && failed && failed.id === id && failed.range === range && failed.tick === tick
    ? failed.message
    : null;
  const isCurrent = loaded !== null && loaded.id === id && loaded.range === range;

  return {
    points: loaded ? loaded.points : [],
    shownId: loaded ? loaded.id : null,
    shownRange: loaded ? loaded.range : null,
    loading: enabled && loaded === null && error === null,
    refreshing: enabled && loaded !== null && !isCurrent && error === null,
    error,
    refetch,
  };
}
