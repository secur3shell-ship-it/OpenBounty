"use client";

// The bounty detail page: header, notices, and tabs for Prizes, Submissions and
// Judging, next to the details panel. Owns the vote, claim and refund handlers so
// every tab and dialog shares them.

import { useState } from "react";
import Link from "next/link";
import type { Address } from "@solana/kit";
import { CircleCheck, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { useWalletModal } from "@/components/wallet/WalletModal";
import BountyDetailSkeleton from "./BountyDetailSkeleton";
import BountyDetailsPanel from "./BountyDetailsPanel";
import BountyHeader from "./BountyHeader";
import BountyNotices from "./BountyNotices";
import BountyTabs from "./BountyTabs";
import PrizeList from "./PrizeList";
import RefundDialog from "./RefundDialog";
import VoteDialog from "./VoteDialog";
import { useWallet } from "@/hooks/useWallet";
import { useEscrow } from "@/hooks/useEscrow";
import { useBountyActions } from "@/hooks/useBountyActions";
import { useSubmissions } from "@/hooks/useSubmissions";
import type { EscrowAccount } from "@/types/escrow";
import { formatDate, formatSol, placeLabel } from "@/utils/format";
import { getBountyStatus, isClaimWindowOpen, pendingWinnerTiers, refundableTiers } from "@/utils/status";
import { getViewerRoles } from "@/utils/roles";
import { getVoteCandidates, type SubmissionValues } from "@/utils/submissions";
import { toastTxError, toastTxSuccess } from "@/utils/txToast";

interface Props {
  address: string;
}

function sumTiers(escrow: EscrowAccount, tiers: number[]): bigint {
  return tiers.reduce((sum, index) => sum + escrow.tiers[index].amount, 0n);
}

// Settled tiers plus the ones being settled now: does this close the bounty?
function closesBounty(escrow: EscrowAccount, settling: number[]): boolean {
  return escrow.tiers.every((tier, index) => tier.claimed || tier.refunded || settling.includes(index));
}

export default function BountyDetail({ address }: Props) {
  const { address: viewer } = useWallet();
  const { setVisible } = useWalletModal();
  const { escrow, loading, error, refetch } = useEscrow(address);
  const { vote, claim, refund, submitEntry, closeEntry, pending } = useBountyActions(escrow);
  const entries = useSubmissions(escrow);
  const [voteTier, setVoteTier] = useState<number | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [closedMessage, setClosedMessage] = useState<string | null>(null);

  // Keep showing the bounty while it refreshes after a transaction
  if (loading && !escrow) return <BountyDetailSkeleton />;
  if (error && !escrow) return <ErrorState message="Couldn't load this bounty from devnet." onRetry={refetch} />;

  if (!escrow && closedMessage) {
    return (
      <EmptyState
        icon={CircleCheck}
        title="Bounty closed"
        description={closedMessage}
        action={<Button asChild><Link href="/">Explore bounties</Link></Button>}
      />
    );
  }
  if (!escrow) {
    return (
      <EmptyState
        icon={SearchX}
        title="Bounty not found"
        description="The link may be wrong, or the bounty closed after every prize was claimed or refunded."
        action={<Button asChild variant="outline"><Link href="/">Explore bounties</Link></Button>}
      />
    );
  }

  const status = getBountyStatus(escrow);
  const roles = getViewerRoles(escrow, viewer);
  const refundable = refundableTiers(escrow);
  const refundAmount = sumTiers(escrow, refundable);
  const canRefund = roles.isOrganizer && refundable.length > 0;
  const waitingWinners = isClaimWindowOpen(escrow) ? pendingWinnerTiers(escrow) : [];

  let refundReason: string | null = null;
  if (canRefund) {
    refundReason = isClaimWindowOpen(escrow)
      ? "Judging has ended, and some prizes never got a winner."
      : "The claim window has closed.";
  }
  let upcomingRefund: string | null = null;
  if (roles.isOrganizer && status === "ended" && waitingWinners.length > 0) {
    const waiting = formatSol(sumTiers(escrow, waitingWinners));
    upcomingRefund = `Winners have until ${formatDate(escrow.claimDeadline)} to claim ${waiting}. If they don't, you can refund it after that.`;
  }

  // The bounty and its entries refresh together after any change
  function refreshAll() {
    refetch();
    entries.refetch();
  }

  // Shared by the vote dialog and the judging board. Returns true on success.
  async function castVote(tierIndex: number, candidate: Address): Promise<boolean> {
    try {
      const signature = await vote(tierIndex, candidate);
      toastTxSuccess("Vote recorded", signature);
      refreshAll();
      return true;
    } catch (err) {
      toastTxError(err);
      return false;
    }
  }

  async function handleVote(candidate: Address) {
    if (voteTier === null) return;
    if (await castVote(voteTier, candidate)) setVoteTier(null);
  }

  async function handleClaim(tierIndex: number) {
    if (!escrow) return;
    const amount = formatSol(escrow.tiers[tierIndex].amount);
    const isLast = closesBounty(escrow, [tierIndex]);
    try {
      const signature = await claim(tierIndex);
      toastTxSuccess(`Claimed ${amount}`, signature);
      if (isLast) setClosedMessage(`You claimed ${amount}. That was the last prize, so the bounty is now closed.`);
      refreshAll();
    } catch (err) {
      toastTxError(err);
    }
  }

  async function handleRefund() {
    if (!escrow) return;
    const amount = formatSol(refundAmount);
    const isLast = closesBounty(escrow, refundable);
    try {
      const signature = await refund();
      toastTxSuccess(`Refunded ${amount}`, signature);
      setRefundOpen(false);
      if (isLast) setClosedMessage(`${amount} went back to your wallet and the bounty is now closed.`);
      refreshAll();
    } catch (err) {
      toastTxError(err);
    }
  }

  function handleSubmitEntry(values: SubmissionValues) {
    return submitEntry(values);
  }

  const refundDetails = closesBounty(escrow, refundable)
    ? "These prizes go back to your wallet. Nothing else is left, so the bounty closes."
    : "These prizes go back to your wallet. Prizes that winners can still claim stay locked for them.";

  const prizeList = (
    <PrizeList escrow={escrow} viewer={viewer} pending={pending} onVote={setVoteTier} onClaim={handleClaim} />
  );

  return (
    <div className="flex flex-col gap-8">
      <BountyHeader escrow={escrow} status={status} roles={roles} />
      <BountyNotices
        showConnect={!viewer}
        refundText={canRefund ? formatSol(refundAmount) : null}
        refundReason={refundReason}
        upcomingRefund={upcomingRefund}
        onConnect={() => setVisible(true)}
        onRefund={() => setRefundOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <BountyTabs
          escrow={escrow}
          viewer={viewer}
          isJudge={roles.isJudge}
          prizeList={prizeList}
          entries={entries}
          pending={pending}
          onVote={castVote}
          onSubmitEntry={handleSubmitEntry}
          onCloseEntry={closeEntry}
        />
        <BountyDetailsPanel escrow={escrow} viewer={viewer} />
      </div>

      <VoteDialog
        open={voteTier !== null}
        prizeLabel={placeLabel(voteTier ?? 0)}
        threshold={escrow.threshold}
        candidates={voteTier === null ? [] : getVoteCandidates(escrow.tiers[voteTier], entries.submissions)}
        submitting={pending !== null && pending.startsWith("vote")}
        onOpenChange={(open) => { if (!open) setVoteTier(null); }}
        onSubmit={handleVote}
      />
      <RefundDialog
        open={refundOpen}
        amountText={formatSol(refundAmount)}
        details={refundDetails}
        submitting={pending === "refund"}
        onOpenChange={setRefundOpen}
        onConfirm={handleRefund}
      />
    </div>
  );
}
