"use client";

// The organizer's optional details file on the bounty page: longer name, description,
// hackathon, prize names and extra links, as plain text. The chain always wins: when the
// file's judges or prizes differ from the bounty, a short warning says so.

import { ExternalLink, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBountyMetadata } from "@/hooks/useBountyMetadata";
import type { EscrowAccount } from "@/types/escrow";
import { placeLabel } from "@/utils/format";
import { metadataGatewayUrl, metadataMismatch, tierLabels } from "@/utils/metadata";

const LABEL = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const LINK = "inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline";

interface Props {
  escrow: EscrowAccount;
}

// "https://docs.example.org/rules" -> "docs.example.org", so readers see where a link goes
function hostOf(href: string): string {
  try {
    return new URL(href).hostname;
  } catch {
    return "";
  }
}

export default function BountyMetadata({ escrow }: Props) {
  const { metadata, loading, error, refetch } = useBountyMetadata(escrow.metadataUri);

  if (loading && !metadata) {
    return (
      <Card className="gap-3 px-5 py-5" aria-busy="true">
        <span className="sr-only">Loading the bounty details</span>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    );
  }

  if (error && !metadata) {
    return (
      <Card className="flex-row flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load the bounty details file. The prizes and dates below come from the chain.
        </p>
        <Button variant="outline" onClick={refetch}>Try again</Button>
      </Card>
    );
  }

  // No link, or a plain web page: the details panel's "Read the full brief" covers it
  if (!metadata) return null;

  const mismatch = metadataMismatch(metadata, { judges: escrow.judges, tierCount: escrow.tiers.length });
  const labels = tierLabels(metadata, escrow.tiers.length);
  const hasLabels = labels.some((label) => label !== null);
  const name = metadata.name && metadata.name !== escrow.title ? metadata.name : null;
  const hackathonUrl = metadata.hackathon?.url ? metadataGatewayUrl(metadata.hackathon.url) : null;
  const links = metadata.links
    .map((link) => ({ label: link.label, href: metadataGatewayUrl(link.url) }))
    .filter((link): link is { label: string; href: string } => link.href !== null);

  let warning: string | null = null;
  if (mismatch.judges && mismatch.tiers) warning = "lists different judges and prizes than";
  else if (mismatch.judges) warning = "lists different judges than";
  else if (mismatch.tiers) warning = "lists a different number of prizes than";

  const hasContent = name || metadata.description || metadata.hackathon || hasLabels || links.length > 0;
  if (!hasContent && !warning) return null;

  return (
    <Card className="gap-4 px-5 py-5">
      {metadata.hackathon && (
        <p className="text-sm text-muted-foreground">
          Part of{" "}
          {hackathonUrl ? (
            <a href={hackathonUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline-offset-4 hover:underline">
              {metadata.hackathon.name}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <span className="text-foreground">{metadata.hackathon.name}</span>
          )}
        </p>
      )}

      {name && <h2 className="font-display text-2xl break-words">{name}</h2>}

      {metadata.description && (
        <p className="whitespace-pre-wrap break-words text-base">{metadata.description}</p>
      )}

      {hasLabels && (
        <div className="flex flex-col gap-2">
          <span className={LABEL}>Prize names</span>
          <ul className="flex flex-col gap-1 text-sm">
            {labels.map((label, index) => (
              <li key={index} className="break-words">
                <span className="text-muted-foreground">{placeLabel(index)}</span>
                {label && <> · {label}</>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {links.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className={LABEL}>Links</span>
          <ul className="flex flex-col gap-1.5">
            {links.map((link, index) => (
              <li key={index}>
                <a href={link.href} target="_blank" rel="noopener noreferrer nofollow" className={LINK}>
                  <span className="break-all">{link.label}</span>
                  <span className="text-muted-foreground">· {hostOf(link.href)}</span>
                  <ExternalLink className="size-4 shrink-0" aria-hidden />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warning && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-highlight" aria-hidden />
          <span>
            This details file {warning} the bounty on-chain. The judges and prizes shown on this page come
            from the chain.
          </span>
        </p>
      )}
    </Card>
  );
}
