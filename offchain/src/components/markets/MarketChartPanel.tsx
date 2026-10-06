"use client";

// The big chart on the Markets page for the selected token, with range presets
// (1H, 24H, 7D, 30D) in one row above it. 24H and 7D draw instantly from the quote's
// hourly prices and follow the live price; 1H and 30D are fetched from the market feed,
// keeping the old chart dimmed until they load.

import { useState } from "react";
import { Card } from "@/components/ui/card";
import FilterButtons from "@/components/common/FilterButtons";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import PriceChange from "./PriceChange";
import PriceChart from "./PriceChart";
import PriceSummary from "./PriceSummary";
import { MARKET_ASSETS, MarketAsset } from "@/constants/markets";
import type { ChartRange, MarketQuote } from "@/types/market";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { formatUsd } from "@/utils/format";
import { isSparklineRange, pointsFromSparkline } from "@/utils/chart";

const RANGES: ChartRange[] = ["1H", "24H", "7D", "30D"];

interface Props {
  asset: MarketAsset;
  quote: MarketQuote | undefined;
}

export default function MarketChartPanel({ asset, quote }: Props) {
  const [range, setRange] = useState<ChartRange>("24H");
  const fromQuote = isSparklineRange(range);
  const history = usePriceHistory(asset.id, range, !fromQuote);

  function renderChart() {
    if (fromQuote) {
      if (!quote) return <Skeleton className="h-64 rounded-md" />;
      const points = pointsFromSparkline(quote, range);
      return (
        <>
          <PriceChart points={points} range={range} label={`${asset.name} price`} />
          <PriceSummary points={points} />
        </>
      );
    }

    if (history.error) return <ErrorState message={history.error} onRetry={history.refetch} />;
    if (history.loading) return <Skeleton className="h-64 rounded-md" />;

    // While a new choice loads, the dimmed chart is still labelled with what it shows
    const shownAsset = MARKET_ASSETS.find((a) => a.id === history.shownId) ?? asset;
    const shownRange = history.shownRange ?? range;
    return (
      <>
        <PriceChart points={history.points} range={shownRange} label={`${shownAsset.name} price`} dimmed={history.refreshing} />
        <PriceSummary points={history.points} />
      </>
    );
  }

  return (
    <Card className="gap-4 px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-2xl">{asset.name} <span className="font-sans text-base text-muted-foreground">{asset.id}</span></h2>
          {quote && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold">{formatUsd(quote.priceUsd)}</span>
              <PriceChange percent={quote.change24h} />
              <span className="text-sm text-muted-foreground">24h</span>
            </div>
          )}
        </div>
        <FilterButtons
          label="Chart range"
          options={RANGES.map((value) => ({ value, label: value }))}
          value={range}
          onChange={(value) => setRange(value as ChartRange)}
        />
      </div>
      {renderChart()}
    </Card>
  );
}
