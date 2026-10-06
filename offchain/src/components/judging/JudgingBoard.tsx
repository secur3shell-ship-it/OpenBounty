"use client";

// "Judging" tab (judges only). Entries on one side, prizes on the other: score entries
// privately, then drag one onto a prize (or use "Vote as...") and confirm to vote.

import { useState } from "react";
import type { Address } from "@solana/kit";
import { Inbox, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import FilterButtons from "@/components/common/FilterButtons";
import BoardCard from "./BoardCard";
import PrizeColumn from "./PrizeColumn";
import ScoreCompare from "./ScoreCompare";
import ScoreDialog from "./ScoreDialog";
import VoteConfirmDialog from "./VoteConfirmDialog";
import { useScorecard } from "@/hooks/useScorecard";
import type { PendingAction } from "@/hooks/useBountyActions";
import type { EscrowAccount } from "@/types/escrow";
import type { Submission } from "@/types/submission";
import { EntrySort, sortEntries, votableTiers } from "@/utils/judging";
import { formatSol, placeLabel } from "@/utils/format";
import { isVotingOpen } from "@/utils/status";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "score", label: "Your score" },
];

interface Props {
  escrow: EscrowAccount;
  judge: Address;
  submissions: Submission[];
  loading: boolean;
  pending: PendingAction | null;
  onVote: (tierIndex: number, candidate: Address) => Promise<boolean>;
}

interface VoteRequest {
  tierIndex: number;
  submission: Submission;
}

export default function JudgingBoard({ escrow, judge, submissions, loading, pending, onVote }: Props) {
  const { scorecard, saveScore } = useScorecard(escrow.address, judge);
  const [sort, setSort] = useState<EntrySort>("newest");
  const [scoring, setScoring] = useState<Submission | null>(null);
  const [request, setRequest] = useState<VoteRequest | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  if (loading) {
    return (
      <div aria-busy className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  if (submissions.length === 0) {
    return <EmptyState icon={Inbox} title="No entries to judge yet" description="Entries appear here as builders submit them." />;
  }

  const isEnded = !isVotingOpen(escrow);
  const voteTiers = votableTiers(escrow, judge);
  const entries = sortEntries(submissions, scorecard, sort);

  let intro = "Score entries privately, then drag one onto a prize, or use Vote as..., to cast your vote.";
  if (isEnded) intro = "Voting has closed. Your scores stay here for reference.";
  else if (voteTiers.length === 0) intro = "You've voted on every prize that's still open.";

  function requestVote(tierIndex: number, submissionId: string) {
    const submission = submissions.find((s) => s.id === submissionId);
    if (submission) setRequest({ tierIndex, submission });
  }

  async function confirmVote() {
    if (!request) return;
    const ok = await onVote(request.tierIndex, request.submission.submitter);
    if (ok) setRequest(null);
  }

  const requestTier = request ? escrow.tiers[request.tierIndex] : null;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">{intro}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="entries-heading" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="entries-heading" className="font-display text-xl">Entries</h3>
            <Button variant="ghost" onClick={() => setCompareOpen(true)}>
              <Table2 /> Compare scores
            </Button>
          </div>
          <FilterButtons label="Sort entries" options={SORT_OPTIONS} value={sort} onChange={(v) => setSort(v as EntrySort)} />
          {entries.map((submission) => (
            <BoardCard
              key={submission.id}
              submission={submission}
              escrow={escrow}
              score={scorecard[submission.id]}
              voteTiers={voteTiers}
              onScore={() => setScoring(submission)}
              onVote={(tierIndex) => requestVote(tierIndex, submission.id)}
            />
          ))}
        </section>

        <section aria-labelledby="board-prizes-heading" className="flex flex-col gap-3">
          <h3 id="board-prizes-heading" className="font-display text-xl">Prizes</h3>
          {escrow.tiers.map((_, tierIndex) => (
            <PrizeColumn
              key={tierIndex}
              escrow={escrow}
              tierIndex={tierIndex}
              submissions={submissions}
              judge={judge}
              isEnded={isEnded}
              onDropEntry={(submissionId) => requestVote(tierIndex, submissionId)}
            />
          ))}
        </section>
      </div>

      {scoring && (
        <ScoreDialog
          key={scoring.id}
          open
          entryTitle={scoring.title}
          initial={scorecard[scoring.id]}
          onOpenChange={(open) => { if (!open) setScoring(null); }}
          onSave={(score) => saveScore(scoring.id, score)}
        />
      )}
      <ScoreCompare open={compareOpen} submissions={submissions} scorecard={scorecard} onOpenChange={setCompareOpen} />
      {request && requestTier && (
        <VoteConfirmDialog
          open
          entryTitle={request.submission.title}
          prizeLabel={placeLabel(request.tierIndex)}
          amountText={formatSol(requestTier.amount)}
          currentVotes={requestTier.votes.filter((v) => v.candidate === request.submission.submitter).length}
          threshold={escrow.threshold}
          submitting={pending === `vote-${request.tierIndex}`}
          onOpenChange={(open) => { if (!open) setRequest(null); }}
          onConfirm={confirmVote}
        />
      )}
    </div>
  );
}
