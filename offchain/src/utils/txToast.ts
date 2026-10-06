// Toasts for finished transactions: success with an explorer link, or a plain-English error.

import { toast } from "sonner";
import { explorerUrl } from "@/constants/program";
import { friendlyTxError } from "./txErrors";

export function toastTxSuccess(message: string, signature: string): void {
  toast.success(message, {
    action: {
      label: "View",
      onClick: () => window.open(explorerUrl(signature), "_blank", "noreferrer"),
    },
  });
}

export function toastTxError(err: unknown): void {
  toast.error(friendlyTxError(err));
}
