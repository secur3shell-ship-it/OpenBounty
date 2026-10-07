"use client";

// The latest Solana news (lib/marketData: Solana's RSS today, the parked feed's /news
// when it's configured), loaded once per visit.

import { useCallback, useEffect, useState } from "react";
import type { NewsFeedData } from "@/types/news";
import { fetchNews } from "@/lib/marketData";

interface Result {
  tick: number;
  data: NewsFeedData | null;
  error: string | null;
}

export function useNews() {
  const enabled = true;
  const [result, setResult] = useState<Result | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    fetchNews()
      .then((data) => {
        if (!cancelled) setResult({ tick, data, error: null });
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err.message : "Couldn't load the latest news.";
        if (!cancelled) setResult({ tick, data: null, error });
      });

    return () => { cancelled = true; };
  }, [enabled, tick]);

  // Keep showing loaded items during a retry; only a failed current attempt is an error
  const current = result !== null && result.tick === tick;
  const data = result?.data ?? null;
  return {
    enabled,
    items: data ? data.items : [],
    isSample: data ? data.isSample : false,
    loading: enabled && !current && data === null,
    error: current ? result.error : null,
    refetch,
  };
}
