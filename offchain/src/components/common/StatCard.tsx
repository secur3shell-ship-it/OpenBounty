// A small card with a label and one value, e.g. "TOTAL LOCKED / 9.5 SOL".

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface Props {
  label: string;
  value: ReactNode;
}

export default function StatCard({ label, value }: Props) {
  return (
    <Card className="gap-2 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </Card>
  );
}
