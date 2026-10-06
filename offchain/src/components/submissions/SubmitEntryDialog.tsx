"use client";

// Dialog where a builder submits their entry: project name, link and a short description.
// Errors show after the first submit attempt and update as they type.

import { FormEvent, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FormField, { messageId } from "@/components/common/FormField";
import { MAX_SUBMISSION_DESCRIPTION } from "@/constants/submissions";
import { byteLength } from "@/utils/address";
import { SubmissionValues, validateSubmission } from "@/utils/submissions";

interface Props {
  open: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SubmissionValues) => Promise<boolean>;   // true when it was saved
}

export default function SubmitEntryDialog({ open, submitting, onOpenChange, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [triedSubmit, setTriedSubmit] = useState(false);

  const values = { title, url, description };
  const errors = triedSubmit ? validateSubmission(values) : {};

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTitle("");
      setUrl("");
      setDescription("");
      setTriedSubmit(false);
    }
    onOpenChange(next);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTriedSubmit(true);
    if (Object.values(validateSubmission(values)).some(Boolean)) return;
    const saved = await onSubmit(values);
    if (saved) handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Submit your entry</DialogTitle>
            <DialogDescription>
              Judges review entries and vote for winners. If your entry wins, the prize goes to
              the wallet you&apos;re submitting from.
            </DialogDescription>
          </DialogHeader>

          <FormField id="entry-title" label="Project name" error={errors.title}>
            <Input
              id="entry-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={messageId("entry-title")}
            />
          </FormField>

          <FormField id="entry-url" label="Link" helper="Demo, repo or write-up." error={errors.url}>
            <Input
              id="entry-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              aria-invalid={Boolean(errors.url)}
              aria-describedby={messageId("entry-url")}
            />
          </FormField>

          <FormField
            id="entry-description"
            label="Short description (optional)"
            helper={`${byteLength(description.trim())} / ${MAX_SUBMISSION_DESCRIPTION} characters`}
            error={errors.description}
          >
            <Textarea
              id="entry-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={messageId("entry-description")}
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? "Submitting..." : "Submit entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
