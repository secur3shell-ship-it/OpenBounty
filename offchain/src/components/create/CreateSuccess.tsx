// Shown after a bounty is created: confirmation, transaction link and next steps.

import Link from "next/link";
import { CircleCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { explorerUrl } from "@/constants/program";

interface Props {
  signature: string;
  address: string;       // the new escrow account, for /bounty/[address]
  onCreateAnother: () => void;
}

export default function CreateSuccess({ signature, address, onCreateAnother }: Props) {
  return (
    <Card className="items-center gap-4 px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
        <CircleCheck className="size-7" aria-hidden />
      </div>
      <h2 className="font-display text-2xl">Bounty created</h2>
      <p className="max-w-sm text-base text-muted-foreground">
        The prize pool is locked on-chain. Share the bounty so builders can enter and your judges can vote.
      </p>

      <a
        href={explorerUrl(signature)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-accent-foreground underline-offset-4 hover:underline"
      >
        View transaction <ExternalLink className="size-4" aria-hidden />
      </a>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href={`/bounty/${address}`}>View bounty</Link>
        </Button>
        <Button variant="outline" onClick={onCreateAnother}>
          Create another
        </Button>
      </div>
    </Card>
  );
}
