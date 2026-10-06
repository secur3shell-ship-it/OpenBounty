"use client";

// "Submissions" tab on the bounty page: every entry, and a "Submit entry" button for
// wallets that are allowed to enter (or a short note saying why they can't).

import { useState } from "react";
import type { Address } from "@solana/kit";
import { Inbox, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import SubmissionCard from "./SubmissionCard";
import SubmitEntryDialog from "./SubmitEntryDialog";
import type { EscrowAccount } from "@/types/escrow";
import type { Submission } from "@/types/submission";
import { SUBMIT_BLOCK_TEXT, SubmissionValues, getSubmitBlock } from "@/utils/submissions";
import { toastTxError, toastTxSuccess } from "@/utils/txToast";
import { formatDate } from "@/utils/format";
import { isEntriesOpen } from "@/utils/status";

interface Props {
  escrow: EscrowAccount;
  viewer: Address | null;
  submissions: Submission[];
  loading: boolean;
  error: unknown;
  submitting: boolean;
  closing: boolean;
  onRetry: () => void;
  onSubmitEntry: (values: SubmissionValues) => Promise<string>;   // returns a signature
  onCloseEntry: () => Promise<string>;                            // returns a signature
  onSubmitted: () => void;
}

export default function SubmissionGallery(props: Props) {
  const { escrow, viewer, submissions, loading, error, submitting, closing, onRetry, onSubmitEntry, onCloseEntry, onSubmitted } = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  const block = getSubmitBlock(escrow, viewer, submissions);

  async function handleSubmit(values: SubmissionValues): Promise<boolean> {
    try {
      const signature = await onSubmitEntry(values);
      toastTxSuccess("Entry submitted", signature);
      onSubmitted();
      return true;
    } catch (err) {
      toastTxError(err);
      return false;
    }
  }

  async function handleClose() {
    try {
      const signature = await onCloseEntry();
      toastTxSuccess("Entry closed and rent returned", signature);
      onSubmitted();
    } catch (err) {
      toastTxError(err);
    }
  }

  const submitButton = (
    <Button onClick={() => setDialogOpen(true)}>
      <Send /> Submit entry
    </Button>
  );

  function renderList() {
    if (loading) {
      return (
        <div aria-busy className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      );
    }
    if (error) return <ErrorState message="Couldn't load the entries." onRetry={onRetry} />;
    if (submissions.length === 0) {
      return (
        <EmptyState
          icon={Inbox}
          title="No entries yet"
          description="Entries show up here as builders submit them."
          action={block === null ? submitButton : undefined}
        />
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {submissions.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            escrow={escrow}
            viewer={viewer}
            closing={closing}
            onClose={handleClose}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-muted-foreground">
            {submissions.length} {submissions.length === 1 ? "entry" : "entries"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isEntriesOpen(escrow) ? "Entries close" : "Entries closed"} {formatDate(escrow.submissionsDeadline)}
          </p>
        </div>
        {block === null && submitButton}
        {block !== null && block !== "not-connected" && (
          <p className="text-sm text-muted-foreground">{SUBMIT_BLOCK_TEXT[block]}</p>
        )}
      </div>

      {renderList()}

      <SubmitEntryDialog
        open={dialogOpen}
        submitting={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
