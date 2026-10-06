"use client";

// Explore: every bounty on-chain, soonest next date first, filterable by status.
// Works without a wallet; connecting one adds "You organize / judge / won" tags.

import { useState } from "react";
import Link from "next/link";
import { Plus, SearchX, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import BountyCard from "@/components/bounty/BountyCard";
import BountyCardSkeleton from "@/components/bounty/BountyCardSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import FilterButtons from "@/components/common/FilterButtons";
import { useAllEscrows } from "@/hooks/useAllEscrows";
import { useWallet } from "@/hooks/useWallet";
import type { EscrowAccount } from "@/types/escrow";
import { BountyStatus, getBountyStatus, nowSeconds } from "@/utils/status";

type Filter = "all" | BountyStatus;

const FILTER_LABELS: Record<Filter, string> = {
  "all": "All",
  "open": "Open",
  "ending-soon": "Ending soon",
  "judging": "Judging",
  "ended": "Ended",
};

const FILTERS: Filter[] = ["all", "open", "ending-soon", "judging", "ended"];

function compareBigint(a: bigint, b: bigint): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

// The next date that matters while a bounty runs: entries closing, then judging ending
function nextDate(escrow: EscrowAccount, now: bigint): bigint {
  return now <= escrow.submissionsDeadline ? escrow.submissionsDeadline : escrow.deadline;
}

// Running bounties first (soonest next date first), then ended ones (most recent first)
function sortForExplore(escrows: EscrowAccount[]): EscrowAccount[] {
  const now = nowSeconds();
  const running = escrows
    .filter((e) => e.deadline >= now)
    .sort((a, b) => compareBigint(nextDate(a, now), nextDate(b, now)));
  const ended = escrows
    .filter((e) => e.deadline < now)
    .sort((a, b) => compareBigint(b.deadline, a.deadline));
  return [...running, ...ended];
}

function countByFilter(escrows: EscrowAccount[], filter: Filter): number {
  if (filter === "all") return escrows.length;
  return escrows.filter((e) => getBountyStatus(e) === filter).length;
}

export default function ExploreBounties() {
  const { address: viewer } = useWallet();
  const { escrows, loading, error, refetch } = useAllEscrows();
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = sortForExplore(escrows);
  const visible = filter === "all" ? sorted : sorted.filter((e) => getBountyStatus(e) === filter);

  const filterOptions = FILTERS.map((value) => ({
    value,
    label: FILTER_LABELS[value],
    count: loading ? undefined : countByFilter(escrows, value),
  }));

  const createButton = (
    <Button asChild>
      <Link href="/create"><Plus /> Create bounty</Link>
    </Button>
  );

  function renderList() {
    if (loading) {
      return (
        <div aria-busy className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <BountyCardSkeleton key={i} />)}
        </div>
      );
    }
    if (error) {
      return <ErrorState message="Couldn't load bounties from devnet." onRetry={refetch} />;
    }
    if (escrows.length === 0) {
      return (
        <EmptyState
          icon={Trophy}
          title="No bounties yet"
          description="Be the first to lock a prize pool on-chain."
          action={createButton}
        />
      );
    }
    if (visible.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="No bounties match this filter"
          description="Try another filter."
          action={<Button variant="outline" onClick={() => setFilter("all")}>Show all</Button>}
        />
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((escrow) => (
          <BountyCard key={escrow.address} escrow={escrow} viewer={viewer} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Explore bounties"
        description="Prize pools locked on Solana. Judges vote on winners, winners claim directly."
      />
      <FilterButtons
        label="Filter by status"
        options={filterOptions}
        value={filter}
        onChange={(value) => setFilter(value as Filter)}
      />
      {renderList()}
    </div>
  );
}
