"use client";

// Tabs on the bounty page: Prizes, Submissions, and Judging for the bounty's judges.

import { ReactNode } from "react";
import type { Address } from "@solana/kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubmissionGallery from "@/components/submissions/SubmissionGallery";
import JudgingBoard from "@/components/judging/JudgingBoard";
import type { SubmissionsState } from "@/hooks/useSubmissions";
import type { PendingAction } from "@/hooks/useBountyActions";
import type { EscrowAccount } from "@/types/escrow";
import type { SubmissionValues } from "@/utils/submissions";

interface Props {
  escrow: EscrowAccount;
  viewer: Address | null;
  isJudge: boolean;
  prizeList: ReactNode;
  entries: SubmissionsState;
  pending: PendingAction | null;
  onVote: (tierIndex: number, candidate: Address) => Promise<boolean>;
  onSubmitEntry: (values: SubmissionValues) => Promise<string>;
  onCloseEntry: () => Promise<string>;
}

export default function BountyTabs(props: Props) {
  const { escrow, viewer, isJudge, prizeList, entries, pending, onVote, onSubmitEntry, onCloseEntry } = props;
  const count = entries.loading && entries.submissions.length === 0 ? "" : ` (${entries.submissions.length})`;
  const showJudging = isJudge && viewer !== null;

  return (
    <Tabs defaultValue="prizes" className="gap-4">
      <TabsList>
        <TabsTrigger value="prizes">Prizes</TabsTrigger>
        <TabsTrigger value="submissions">Submissions{count}</TabsTrigger>
        {showJudging && <TabsTrigger value="judging">Judging</TabsTrigger>}
      </TabsList>

      <TabsContent value="prizes">{prizeList}</TabsContent>

      <TabsContent value="submissions">
        <SubmissionGallery
          escrow={escrow}
          viewer={viewer}
          submissions={entries.submissions}
          loading={entries.loading && entries.submissions.length === 0}
          error={entries.error}
          submitting={pending === "submit"}
          closing={pending === "close-entry"}
          onRetry={entries.refetch}
          onSubmitEntry={onSubmitEntry}
          onCloseEntry={onCloseEntry}
          onSubmitted={entries.refetch}
        />
      </TabsContent>

      {showJudging && viewer && (
        <TabsContent value="judging">
          <JudgingBoard
            escrow={escrow}
            judge={viewer}
            submissions={entries.submissions}
            loading={entries.loading && entries.submissions.length === 0}
            pending={pending}
            onVote={onVote}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
