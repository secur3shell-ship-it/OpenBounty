"use client";

// The Markets page: live prices for Solana tokens (plus BTC and ETH for reference),
// a big chart for the selected token, and the prize converter. Prices are pushed by
// our market feed; without one configured, the page says so calmly.

import { useState } from "react";
import { Info, PlugZap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import MarketCard from "./MarketCard";
import MarketChartPanel from "./MarketChartPanel";
import PrizeConverter, { ConverterPrefill } from "./PrizeConverter";
import MarketsStatusLine from "./MarketsStatusLine";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { useAllEscrows } from "@/hooks/useAllEscrows";
import { useWallet } from "@/hooks/useWallet";
import { MARKET_ASSETS, MarketAsset, MarketId } from "@/constants/markets";
import { getViewerTasks } from "@/utils/tasks";

const LABEL = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

// Lamports -> exact SOL text for the converter's input: 1500000000n -> "1.5"
function lamportsToText(lamports: bigint): string {
  const whole = lamports / 1_000_000_000n;
  const fraction = (lamports % 1_000_000_000n).toString().padStart(9, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export default function MarketsView() {
  const { address } = useWallet();
  const market = useMarketQuotes();
  // Bounties are only needed to pre-fill the converter, so only load them with a wallet
  const { escrows } = useAllEscrows(address !== null);
  const [selected, setSelected] = useState<MarketId>("SOL");

  // First prize waiting to be claimed, if any. Prizes are SOL in v1.
  let prefill: ConverterPrefill | null = null;
  if (address) {
    const task = getViewerTasks(escrows, address).toClaim[0];
    if (task) {
      const amount = lamportsToText(task.escrow.tiers[task.tierIndex].amount);
      prefill = { amount, asset: "SOL", source: task.escrow.title };
    }
  }

  const solanaTokens = MARKET_ASSETS.filter((asset) => asset.onSolana);
  const reference = MARKET_ASSETS.filter((asset) => !asset.onSolana);
  const selectedAsset = MARKET_ASSETS.find((asset) => asset.id === selected) ?? MARKET_ASSETS[0];

  function renderCards(assets: MarketAsset[]) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {assets.map((asset) => {
          const quote = market.quotes.find((q) => q.id === asset.id);
          if (!quote) return null;
          return (
            <MarketCard key={asset.id} asset={asset} quote={quote} selected={asset.id === selected} onSelect={() => setSelected(asset.id)} />
          );
        })}
      </div>
    );
  }

  function renderContent() {
    if (market.status === "off") {
      return (
        <EmptyState
          icon={PlugZap}
          title="Live prices aren't connected yet"
          description="This page shows live token prices once the market feed is set up. Bounties work as usual in the meantime."
        />
      );
    }
    if (market.loading) {
      return (
        <div aria-busy className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      );
    }
    if (market.error && market.quotes.length === 0) {
      return <ErrorState message={market.error} onRetry={market.refetch} />;
    }
    return (
      <>
        <section aria-labelledby="solana-heading" className="flex flex-col gap-3">
          <h2 id="solana-heading" className={LABEL}>Tokens on Solana</h2>
          {renderCards(solanaTokens)}
        </section>
        <section aria-labelledby="reference-heading" className="flex flex-col gap-3">
          <h2 id="reference-heading" className={LABEL}>For reference</h2>
          {renderCards(reference)}
        </section>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <MarketChartPanel asset={selectedAsset} quote={market.quotes.find((q) => q.id === selected)} />
          <PrizeConverter key={prefill ? prefill.source : "none"} quotes={market.quotes} prefill={prefill} />
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Markets"
        description="Live prices for popular Solana tokens, plus Bitcoin and Ethereum for reference."
      />

      {market.status !== "off" && (
        <div className="flex flex-col gap-3">
          <MarketsStatusLine
            status={market.status}
            updatedAt={market.updatedAt}
            source={market.source}
            hasQuotes={market.quotes.length > 0}
          />
          <Alert>
            <Info aria-hidden />
            <AlertDescription>
              Prices are for information only. Prizes are paid in SOL.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
