"use client";

// A wallet address shortened to "AbCd...WxYz", with the full address in a tooltip and a copy button.

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { truncateAddress } from "@/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  address: string;
  isYou?: boolean;      // adds a "you" tag when the address is the connected wallet
  className?: string;
}

export default function Address({ address, isYou = false, className }: Props) {
  async function copy() {
    await navigator.clipboard.writeText(address);
    toast.success("Address copied");
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-mono text-sm text-muted-foreground">
            {truncateAddress(address)}
          </span>
        </TooltipTrigger>
        <TooltipContent className="font-mono">{address}</TooltipContent>
      </Tooltip>

      {isYou && <span className="text-xs font-semibold text-highlight">you</span>}

      <Button variant="ghost" size="icon-xs" onClick={copy} aria-label="Copy address">
        <Copy />
      </Button>
    </span>
  );
}
