"use client";

// "Bounty details file (optional)" in the create form: a collapsed builder for the
// openbounty.metadata.v1 JSON file. It only downloads the file; nothing is sent anywhere.

import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FormField, { messageId } from "@/components/common/FormField";
import MetadataLinksField from "./MetadataLinksField";
import MetadataNamesField from "./MetadataNamesField";
import { cn } from "@/lib/utils";
import {
  EMPTY_BUILDER_FIELDS,
  METADATA_LIMITS,
  buildMetadata,
  builderJudges,
  hasBuilderErrors,
  validateBuilderFields,
  type MetadataBuilderFields,
  type MetadataFormValues,
} from "@/utils/metadata";

const FILE_NAME = "openbounty-metadata.json";
const PANEL_ID = "metadata-builder";

interface Props {
  formValues: MetadataFormValues;  // the create form's judges and prizes, blank rows removed
}

// Saves text as a file through a temporary object URL
function downloadJson(data: unknown) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = FILE_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function MetadataBuilder({ formValues }: Props) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<MetadataBuilderFields>(EMPTY_BUILDER_FIELDS);
  const [tried, setTried] = useState(false);

  const liveErrors = validateBuilderFields(fields);
  const errors = tried ? liveErrors : {};
  const judges = builderJudges(formValues.judges);

  function update(change: Partial<MetadataBuilderFields>) {
    setFields((prev) => ({ ...prev, ...change }));
  }

  function handleDownload() {
    setTried(true);
    if (hasBuilderErrors(liveErrors)) {
      toast.error("Please fix the highlighted links.");
      return;
    }
    downloadJson(buildMetadata(formValues, fields));
    toast.success(`Downloaded ${FILE_NAME}. Host it, then paste its link in Details link.`);
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="ghost"
        className="-mx-3 self-start"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((prev) => !prev)}
      >
        <ChevronDown className={cn("motion-safe:transition-transform motion-safe:duration-200", open && "rotate-180")} aria-hidden />
        Bounty details file (optional)
      </Button>

      {open && (
        <div id={PANEL_ID} className="flex flex-col gap-6 rounded-xl border border-border px-4 py-5 sm:px-5">
          <p className="text-sm text-muted-foreground">
            Write a longer description and names for judges and prizes, then download them as a JSON file. Host
            the file yourself (for example on IPFS or any https site) and paste its link in Details link above.
          </p>

          <FormField id="meta-name" label="Longer name" helper="Shown on the bounty page under the short title.">
            <Input
              id="meta-name"
              value={fields.name}
              onChange={(e) => update({ name: e.target.value })}
              maxLength={METADATA_LIMITS.name}
              aria-describedby={messageId("meta-name")}
            />
          </FormField>

          <FormField id="meta-description" label="Description" helper="Plain text. Line breaks are kept.">
            <Textarea
              id="meta-description"
              value={fields.description}
              onChange={(e) => update({ description: e.target.value })}
              maxLength={METADATA_LIMITS.description}
              rows={5}
              aria-describedby={messageId("meta-description")}
            />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField id="meta-hackathon" label="Hackathon name" error={errors.hackathonName}>
              <Input
                id="meta-hackathon"
                value={fields.hackathonName}
                onChange={(e) => update({ hackathonName: e.target.value })}
                placeholder="e.g. Example Hack 2026"
                maxLength={METADATA_LIMITS.hackathonName}
                aria-invalid={Boolean(errors.hackathonName)}
                aria-describedby={messageId("meta-hackathon")}
              />
            </FormField>
            <FormField id="meta-hackathon-url" label="Hackathon website" error={errors.hackathonUrl}>
              <Input
                id="meta-hackathon-url"
                value={fields.hackathonUrl}
                onChange={(e) => update({ hackathonUrl: e.target.value })}
                placeholder="https://..."
                maxLength={METADATA_LIMITS.url}
                spellCheck={false}
                aria-invalid={Boolean(errors.hackathonUrl)}
                aria-describedby={messageId("meta-hackathon-url")}
              />
            </FormField>
          </div>

          <MetadataNamesField
            judges={judges}
            judgeNames={fields.judgeNames}
            prizeCount={formValues.tierAmounts.length}
            prizeLabels={fields.prizeLabels}
            onJudgeNamesChange={(judgeNames) => update({ judgeNames })}
            onPrizeLabelsChange={(prizeLabels) => update({ prizeLabels })}
          />

          <MetadataLinksField links={fields.links} errors={errors.links} onChange={(links) => update({ links })} />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              The file uses the judges and prizes entered in this form.
            </p>
            <Button type="button" variant="outline" onClick={handleDownload} className="self-start sm:self-auto">
              <Download /> Download JSON
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
