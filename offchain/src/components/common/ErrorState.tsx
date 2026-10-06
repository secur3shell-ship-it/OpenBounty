// Shown when loading fails: a plain-English message and a "Try again" button.

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "Something went wrong while loading. Check your connection and try again.",
  onRetry,
}: Props) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 px-6 py-14 text-center"
    >
      <TriangleAlert className="size-8 text-destructive" aria-hidden />
      <p className="max-w-sm text-sm text-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
