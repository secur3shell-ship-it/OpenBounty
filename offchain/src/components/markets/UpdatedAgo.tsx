"use client";

// "Updated 12s ago". It ticks by itself, so only this label re-renders every second.

import { useNow } from "@/hooks/useNow";
import { formatUpdatedAgo } from "@/utils/format";

interface Props {
  date: Date | null;
}

export default function UpdatedAgo({ date }: Props) {
  const now = useNow();
  if (!date) return <span>Loading prices...</span>;
  return <span>Updated {formatUpdatedAgo(date, now)}</span>;
}
