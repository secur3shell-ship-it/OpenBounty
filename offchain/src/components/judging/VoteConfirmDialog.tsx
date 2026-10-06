"use client";

// Confirms a vote from the judging board, and says whether this vote picks the winner.

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  entryTitle: string;
  prizeLabel: string;       // "1st prize"
  amountText: string;       // "2,500 USDC"
  currentVotes: number;     // votes the entry already has for this prize
  threshold: number;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function VoteConfirmDialog(props: Props) {
  const { open, entryTitle, prizeLabel, amountText, currentVotes, threshold, submitting, onOpenChange, onConfirm } = props;
  const votesAfter = currentVotes + 1;
  const picksWinner = votesAfter >= threshold;

  let outcome = `It will have ${votesAfter} of the ${threshold} votes needed.`;
  if (picksWinner) outcome = `Your vote reaches ${threshold}, so it wins the ${prizeLabel} (${amountText}).`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vote for &ldquo;{entryTitle}&rdquo; as {prizeLabel}?</DialogTitle>
          <DialogDescription>{outcome} Votes can&apos;t be changed.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm} disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {submitting ? "Confirming..." : "Cast vote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
