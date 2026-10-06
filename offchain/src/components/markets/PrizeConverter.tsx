"use client";

// "What's my prize worth?": enter an amount and pick a token to see its value in dollars
// and in the other Solana tokens, at market prices. For information only: prizes are
// paid in SOL. Can be pre-filled with a prize waiting to be claimed. Render with
// key={...} so a new pre-fill resets the form.

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import FormField, { messageId } from "@/components/common/FormField";
import { ASSET_IDS, AssetId } from "@/constants/assets";
import type { MarketQuote } from "@/types/market";
import { formatUsd } from "@/utils/format";
import { cn } from "@/lib/utils";

export interface ConverterPrefill {
  amount: string;
  asset: AssetId;
  source: string;         // title of the bounty the prize comes from
}

interface Props {
  quotes: MarketQuote[];
  prefill: ConverterPrefill | null;
}

function formatTokenValue(value: number, asset: AssetId): string {
  const digits = value < 1 ? 6 : 2;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: digits })} ${asset}`;
}

export default function PrizeConverter({ quotes, prefill }: Props) {
  const [amount, setAmount] = useState(prefill ? prefill.amount : "100");
  const [asset, setAsset] = useState<AssetId>(prefill ? prefill.asset : "USDC");

  function priceOf(id: AssetId): number | null {
    const quote = quotes.find((q) => q.id === id);
    return quote ? quote.priceUsd : null;
  }

  const value = Number(amount) > 0 ? Number(amount) : 0;
  const fromPrice = priceOf(asset);
  const usd = fromPrice === null ? null : value * fromPrice;
  const targets = ASSET_IDS.filter((id) => id !== asset);

  return (
    <Card className="gap-4 px-5 py-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl">What&apos;s my prize worth?</h2>
        {prefill && (
          <p className="text-sm text-muted-foreground">Filled in with your prize from &ldquo;{prefill.source}&rdquo;.</p>
        )}
      </div>

      <FormField id="convert-amount" label="Amount">
        <Input
          id="convert-amount"
          type="number"
          inputMode="decimal"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-describedby={messageId("convert-amount")}
        />
      </FormField>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Token</legend>
        <div className="flex flex-wrap gap-2">
          {ASSET_IDS.map((id) => (
            <label
              key={id}
              className={cn(
                "flex h-11 cursor-pointer items-center rounded-md border px-3 text-sm font-semibold transition-colors hover:bg-accent sm:h-9",
                "has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-2 has-focus-visible:ring-ring"
              )}
            >
              <input type="radio" name="convert-asset" value={id} checked={asset === id} onChange={() => setAsset(id)} className="sr-only" />
              {id}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 rounded-lg bg-muted/50 px-4 py-3" aria-live="polite">
        <span className="text-sm text-muted-foreground">Worth about</span>
        <span className="text-2xl font-semibold">{usd === null ? "-" : formatUsd(usd)}</span>
        <ul className="flex flex-col gap-1 text-sm">
          {targets.map((id) => {
            const toPrice = priceOf(id);
            if (usd === null || toPrice === null) return null;
            return (
              <li key={id} className="flex justify-between gap-2">
                <span className="text-muted-foreground">in {id}</span>
                <span className="tabular-nums">{formatTokenValue(usd / toPrice, id)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Based on market prices, for information only. A real swap would also include fees
        and price impact.
      </p>
    </Card>
  );
}
