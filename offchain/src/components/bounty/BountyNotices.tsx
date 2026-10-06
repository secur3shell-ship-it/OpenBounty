// Banners under the bounty title: "connect your wallet" when logged out, and the
// organizer's refund panel once prizes become refundable (or when they will).

import { Undo2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  showConnect: boolean;
  refundText: string | null;     // e.g. "1 SOL" when a refund is possible now, otherwise null
  refundReason: string | null;   // why those prizes are refundable
  upcomingRefund: string | null; // e.g. "Winners have until Oct 25 to claim 2 SOL."
  onConnect: () => void;
  onRefund: () => void;
}

export default function BountyNotices({ showConnect, refundText, refundReason, upcomingRefund, onConnect, onRefund }: Props) {
  return (
    <>
      {showConnect && (
        <Card className="flex-row flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm">Builder, judge or winner? Connect your wallet to enter, vote or claim.</p>
          <Button variant="outline" onClick={onConnect}>
            <Wallet /> Connect wallet
          </Button>
        </Card>
      )}

      {refundText && (
        <Card className="flex-row flex-wrap items-center justify-between gap-3 px-5 py-4 ring-destructive/40">
          <p className="text-sm">
            {refundReason} You can refund {refundText}.
            {upcomingRefund && <span className="text-muted-foreground"> {upcomingRefund}</span>}
          </p>
          <Button variant="destructive" onClick={onRefund}>
            <Undo2 /> Refund {refundText}
          </Button>
        </Card>
      )}

      {!refundText && upcomingRefund && (
        <Card className="px-5 py-4">
          <p className="text-sm text-muted-foreground">{upcomingRefund}</p>
        </Card>
      )}
    </>
  );
}
