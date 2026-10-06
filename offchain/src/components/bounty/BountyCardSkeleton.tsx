// Loading placeholder shaped like a BountyCard.

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BountyCardSkeleton() {
  return (
    <Card className="gap-4 px-5 py-5" aria-hidden>
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className="h-4 w-3/4" />
    </Card>
  );
}
