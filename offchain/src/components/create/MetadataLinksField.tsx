"use client";

// Details-file builder: up to 5 extra links (label and URL), such as the rules or a Discord.

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { METADATA_LIMITS, type MetadataLink } from "@/utils/metadata";

interface Props {
  links: MetadataLink[];
  errors?: (string | undefined)[];
  onChange: (links: MetadataLink[]) => void;
}

export default function MetadataLinksField({ links, errors, onChange }: Props) {
  function updateLink(index: number, change: Partial<MetadataLink>) {
    onChange(links.map((link, i) => (i === index ? { ...link, ...change } : link)));
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">Extra links</legend>
      <p className="text-sm text-muted-foreground">
        Up to {METADATA_LIMITS.links} links, such as the rules or a chat. Use https://, ipfs:// or ar:// links.
      </p>

      {links.map((link, index) => {
        const error = errors?.[index];
        const errorId = `meta-link-${index}-error`;
        return (
          <div key={index} className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={link.label}
                onChange={(e) => updateLink(index, { label: e.target.value })}
                placeholder="Label, e.g. Rules"
                aria-label={`Link ${index + 1} label`}
                maxLength={METADATA_LIMITS.linkLabel}
                className="sm:max-w-48"
                autoComplete="off"
              />
              <div className="flex flex-1 gap-2">
                <Input
                  value={link.url}
                  onChange={(e) => updateLink(index, { url: e.target.value })}
                  placeholder="https://..."
                  aria-label={`Link ${index + 1} URL`}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  maxLength={METADATA_LIMITS.url}
                  spellCheck={false}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLink(index)}
                  aria-label={`Remove link ${index + 1}`}
                >
                  <X />
                </Button>
              </div>
            </div>
            {error && <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => onChange([...links, { label: "", url: "" }])}
        disabled={links.length >= METADATA_LIMITS.links}
      >
        <Plus /> Add link
      </Button>
    </fieldset>
  );
}
