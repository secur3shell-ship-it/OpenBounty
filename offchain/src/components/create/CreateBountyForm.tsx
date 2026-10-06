"use client";

// The create-bounty form: basics, judges, prizes and timeline, then one transaction.
// Errors appear after the first submit attempt and update as you type.

import { FormEvent, useState } from "react";
import { Loader2, Lock, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import FormField, { messageId } from "@/components/common/FormField";
import { useWalletModal } from "@/components/wallet/WalletModal";
import JudgesField from "./JudgesField";
import PrizeTiersField from "./PrizeTiersField";
import TimelineField from "./TimelineField";
import CreateSuccess from "./CreateSuccess";
import MetadataBuilder from "./MetadataBuilder";
import {
  CreateBountyValues,
  CreatedBounty,
  DEFAULT_CLAIM_WINDOW_TEXT,
  hasErrors,
  useCreateBounty,
  validateForm,
} from "@/hooks/useCreateBounty";
import { useWallet } from "@/hooks/useWallet";
import { MAX_METADATA_URI_BYTES, MAX_TITLE_BYTES } from "@/constants/program";
import { friendlyTxError } from "@/utils/txErrors";

function filledCount(rows: string[]): number {
  return rows.filter((row) => row.trim() !== "").length;
}

// Smallest strict majority of n judges: 1 -> 1, 2 -> 2, 3 -> 2, 4 -> 3, 5 -> 3
function majority(judgeCount: number): number {
  return Math.floor(judgeCount / 2) + 1;
}

export default function CreateBountyForm() {
  const { address } = useWallet();
  const { setVisible } = useWalletModal();
  const { createBounty, submitting } = useCreateBounty();

  const [title, setTitle] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [judges, setJudges] = useState<string[]>([""]);
  const [threshold, setThreshold] = useState(1);
  const [thresholdTouched, setThresholdTouched] = useState(false);
  const [amounts, setAmounts] = useState<string[]>([""]);
  const [submissionsDeadline, setSubmissionsDeadline] = useState("");
  const [deadline, setDeadline] = useState("");
  const [claimWindowDays, setClaimWindowDays] = useState(DEFAULT_CLAIM_WINDOW_TEXT);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [created, setCreated] = useState<CreatedBounty | null>(null);

  // Blank rows are ignored, so a spare empty input never blocks submitting
  const values: CreateBountyValues = {
    title,
    metadataUri,
    judges: judges.filter((judge) => judge.trim() !== ""),
    threshold,
    tierAmounts: amounts.filter((amount) => amount.trim() !== ""),
    submissionsDeadline,
    deadline,
    claimWindowDays,
  };
  const liveErrors = validateForm(values, address);
  const errors = triedSubmit ? liveErrors : {};
  const timelineValid = !liveErrors.submissionsDeadline && !liveErrors.deadline && !liveErrors.claimWindowDays;

  // Until you pick a number yourself, the threshold follows the judge count (a simple
  // majority). After that it is only nudged back into the valid range.
  function handleJudgesChange(next: string[]) {
    setJudges(next);
    const count = filledCount(next);
    if (count === 0) return;
    if (!thresholdTouched) setThreshold(majority(count));
    else setThreshold(Math.min(count, Math.max(majority(count), threshold)));
  }

  function handleThresholdChange(next: number) {
    setThresholdTouched(true);
    setThreshold(next);
  }

  function resetForm() {
    setTitle("");
    setMetadataUri("");
    setJudges([""]);
    setThreshold(1);
    setThresholdTouched(false);
    setAmounts([""]);
    setSubmissionsDeadline("");
    setDeadline("");
    setClaimWindowDays(DEFAULT_CLAIM_WINDOW_TEXT);
    setTriedSubmit(false);
    setCreated(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!address) {
      setVisible(true);
      return;
    }

    setTriedSubmit(true);
    if (hasErrors(liveErrors)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    try {
      const result = await createBounty(values);
      toast.success("Bounty created");
      setCreated(result);
    } catch (err) {
      toast.error(friendlyTxError(err));
    }
  }

  if (created) {
    return <CreateSuccess signature={created.signature} address={created.address} onCreateAnother={resetForm} />;
  }

  let submitContent = <><Lock /> Lock prizes and create</>;
  if (!address) submitContent = <><Wallet /> Connect wallet to create</>;
  if (submitting) submitContent = <><Loader2 className="animate-spin" /> Confirming...</>;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card className="gap-8 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6">
          <FormField id="title" label="Title" helper={`Up to ${MAX_TITLE_BYTES} characters.`} error={errors.title}>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build a Solana wallet tracker"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={messageId("title")}
            />
          </FormField>

          <FormField
            id="metadata-uri"
            label="Details link (optional)"
            helper={`Link to the full brief, e.g. on IPFS or Arweave. Up to ${MAX_METADATA_URI_BYTES} characters.`}
            error={errors.metadataUri}
          >
            <Input
              id="metadata-uri"
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              placeholder="ipfs://... or https://..."
              aria-invalid={Boolean(errors.metadataUri)}
              aria-describedby={messageId("metadata-uri")}
            />
          </FormField>
          <MetadataBuilder formValues={values} />
        </div>

        <Separator />

        <JudgesField
          judges={judges}
          threshold={threshold}
          judgesError={errors.judges}
          thresholdError={errors.threshold}
          onJudgesChange={handleJudgesChange}
          onThresholdChange={handleThresholdChange}
        />

        <Separator />

        <PrizeTiersField amounts={amounts} error={errors.tierAmounts} onChange={setAmounts} />

        <Separator />

        <TimelineField
          submissionsDeadline={submissionsDeadline}
          deadline={deadline}
          claimWindowDays={claimWindowDays}
          errors={errors}
          showSummary={timelineValid}
          onSubmissionsDeadlineChange={setSubmissionsDeadline}
          onDeadlineChange={setDeadline}
          onClaimWindowDaysChange={setClaimWindowDays}
        />

        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto sm:self-end">
          {submitContent}
        </Button>
      </Card>
    </form>
  );
}
