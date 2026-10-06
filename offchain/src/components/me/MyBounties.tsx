"use client";

// "Your bounties": what needs you (votes, claims, refunds) and the bounties you
// organize or judge. Asks you to connect a wallet first.

import Link from "next/link";
import { CircleCheck, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import StatCard from "@/components/common/StatCard";
import TokenAmount from "@/components/common/TokenAmount";
import { useWalletModal } from "@/components/wallet/WalletModal";
import BountyGridSection from "./BountyGridSection";
import MyEntries from "./MyEntries";
import MyBountiesSkeleton from "./MyBountiesSkeleton";
import TaskRow from "./TaskRow";
import TaskSection from "./TaskSection";
import { useAllEscrows } from "@/hooks/useAllEscrows";
import { useHydrated } from "@/hooks/useHydrated";
import { useMyEntries } from "@/hooks/useMyEntries";
import { useWallet } from "@/hooks/useWallet";
import type { EscrowAccount } from "@/types/escrow";
import { formatDeadline, formatSol, placeLabel } from "@/utils/format";
import { refundableTiers } from "@/utils/status";
import { getViewerTasks } from "@/utils/tasks";

function bountyHref(escrow: EscrowAccount): string {
  return `/bounty/${escrow.address}`;
}

// Unix seconds -> "Oct 25"
function shortDate(unixSeconds: bigint): string {
  return new Date(Number(unixSeconds) * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Sum of the prizes the organizer can refund right now
function refundableTotal(escrow: EscrowAccount): bigint {
  return refundableTiers(escrow).reduce((sum, index) => sum + escrow.tiers[index].amount, 0n);
}

export default function MyBounties() {
  const hydrated = useHydrated();
  const { address: viewer, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const { escrows, loading, error, refetch } = useAllEscrows(viewer !== null);
  const myEntries = useMyEntries(viewer, escrows, !loading);

  const header = (
    <PageHeader title="Your bounties" description="What needs you, and the bounties you run or judge." />
  );

  // The wallet is only known in the browser, and may still be reconnecting
  if (!hydrated || connecting || (viewer && loading)) {
    return (
      <div aria-busy className="flex flex-col gap-10">
        {header}
        <MyBountiesSkeleton />
      </div>
    );
  }

  if (!viewer) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <EmptyState
          icon={Wallet}
          title="Connect your wallet"
          description="See the bounties you organize, judge or won."
          action={<Button onClick={() => setVisible(true)}><Wallet /> Connect wallet</Button>}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <ErrorState message="Couldn't load bounties from devnet." onRetry={refetch} />
      </div>
    );
  }

  const tasks = getViewerTasks(escrows, viewer);
  const claimTotal = tasks.toClaim.reduce((sum, task) => sum + task.escrow.tiers[task.tierIndex].amount, 0n);
  const todoCount = tasks.toVote.length + tasks.toClaim.length + tasks.toRefund.length;

  return (
    <div className="flex flex-col gap-10">
      {header}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Organizing" value={tasks.organizing.length} />
        <StatCard label="Judging" value={tasks.judging.length} />
        <StatCard label="Ready to claim" value={<TokenAmount amount={claimTotal} />} />
      </div>

      {todoCount === 0 && (
        <EmptyState
          icon={CircleCheck}
          title="Nothing needs you right now"
          description="Votes, claims and refunds will show up here."
        />
      )}

      <TaskSection title="Needs your vote" count={tasks.toVote.length}>
        {tasks.toVote.map(({ escrow, tierIndex }) => (
          <TaskRow
            key={`${escrow.address}-${tierIndex}`}
            href={bountyHref(escrow)}
            title={escrow.title}
            detail={`${placeLabel(tierIndex)} · ${formatSol(escrow.tiers[tierIndex].amount)} · ${formatDeadline(escrow.deadline)} to vote`}
            actionLabel="Vote"
          />
        ))}
      </TaskSection>

      <TaskSection title="Ready to claim" count={tasks.toClaim.length}>
        {tasks.toClaim.map(({ escrow, tierIndex }) => (
          <TaskRow
            key={`${escrow.address}-${tierIndex}`}
            href={bountyHref(escrow)}
            title={escrow.title}
            detail={`${placeLabel(tierIndex)} · ${formatSol(escrow.tiers[tierIndex].amount)} · Claim by ${shortDate(escrow.claimDeadline)}`}
            actionLabel="Claim"
          />
        ))}
      </TaskSection>

      <TaskSection title="Refund available" count={tasks.toRefund.length}>
        {tasks.toRefund.map((escrow) => (
          <TaskRow
            key={escrow.address}
            href={bountyHref(escrow)}
            title={escrow.title}
            detail={`${formatSol(refundableTotal(escrow))} refundable · ${formatDeadline(escrow.deadline, "Judging ended")}`}
            actionLabel="Refund"
          />
        ))}
      </TaskSection>

      <BountyGridSection
        title="Organizing"
        escrows={tasks.organizing}
        viewer={viewer}
        emptyText="You haven't created a bounty yet."
        emptyAction={<Button asChild variant="outline"><Link href="/create"><Plus /> Create bounty</Link></Button>}
      />
      <BountyGridSection
        title="Judging"
        escrows={tasks.judging}
        viewer={viewer}
        emptyText="You're not judging any bounties."
      />
      <MyEntries viewer={viewer} state={myEntries} />
    </div>
  );
}
