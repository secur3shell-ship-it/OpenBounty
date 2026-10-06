"use client";

// Timeline part of the create form: when entries close, when judging ends, and how
// many days winners then have to claim. Shows a one-line summary once the dates are valid.

import { Input } from "@/components/ui/input";
import FormField, { messageId } from "@/components/common/FormField";
import { MAX_CLAIM_WINDOW_DAYS, MIN_CLAIM_WINDOW_DAYS } from "@/constants/program";
import { formatDate } from "@/utils/format";

const DAY_MS = 24 * 60 * 60 * 1000;

interface Props {
  submissionsDeadline: string;   // datetime-local
  deadline: string;              // datetime-local
  claimWindowDays: string;
  errors: { submissionsDeadline?: string; deadline?: string; claimWindowDays?: string };
  showSummary: boolean;          // true when all three values are valid
  onSubmissionsDeadlineChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  onClaimWindowDaysChange: (value: string) => void;
}

// When winners must have claimed by, as "Oct 25, 2026, 6:00 PM"
function claimUntilText(deadline: string, claimWindowDays: string): string {
  const ms = new Date(deadline).getTime() + Number(claimWindowDays) * DAY_MS;
  return formatDate(BigInt(Math.floor(ms / 1000)));
}

export default function TimelineField({
  submissionsDeadline,
  deadline,
  claimWindowDays,
  errors,
  showSummary,
  onSubmissionsDeadlineChange,
  onDeadlineChange,
  onClaimWindowDaysChange,
}: Props) {
  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="mb-1 text-sm font-medium">Timeline</legend>

      <FormField
        id="submissions-deadline"
        label="Entries close"
        helper="Builders can submit entries until then."
        error={errors.submissionsDeadline}
      >
        <Input
          id="submissions-deadline"
          type="datetime-local"
          value={submissionsDeadline}
          onChange={(e) => onSubmissionsDeadlineChange(e.target.value)}
          aria-invalid={Boolean(errors.submissionsDeadline)}
          aria-describedby={messageId("submissions-deadline")}
          className="w-full sm:w-72"
        />
      </FormField>

      <FormField
        id="deadline"
        label="Judging ends"
        helper="Judges vote until then. Prizes nobody won can be refunded after it."
        error={errors.deadline}
      >
        <Input
          id="deadline"
          type="datetime-local"
          value={deadline}
          onChange={(e) => onDeadlineChange(e.target.value)}
          aria-invalid={Boolean(errors.deadline)}
          aria-describedby={messageId("deadline")}
          className="w-full sm:w-72"
        />
      </FormField>

      <FormField
        id="claim-window"
        label="Claim window (days)"
        helper="Winners have this many days after judging ends to claim their prize. After that, you can refund prizes that weren't claimed."
        error={errors.claimWindowDays}
      >
        <Input
          id="claim-window"
          type="number"
          inputMode="numeric"
          min={MIN_CLAIM_WINDOW_DAYS}
          max={MAX_CLAIM_WINDOW_DAYS}
          step={1}
          value={claimWindowDays}
          onChange={(e) => onClaimWindowDaysChange(e.target.value)}
          aria-invalid={Boolean(errors.claimWindowDays)}
          aria-describedby={messageId("claim-window")}
          className="w-24 tabular-nums"
        />
      </FormField>

      <p aria-live="polite" className="text-sm text-muted-foreground empty:hidden">
        {showSummary && (
          <>
            Winners can claim until{" "}
            <span className="font-medium text-foreground">{claimUntilText(deadline, claimWindowDays)}</span>.
          </>
        )}
      </p>
    </fieldset>
  );
}
