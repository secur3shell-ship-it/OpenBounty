// Loading placeholder shaped like the bounty detail page.

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BountyDetailSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-10 w-3/4 max-w-lg" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <Card key={i} className="gap-4 px-5 py-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-2 w-full" />
            </Card>
          ))}
        </div>
        <Card className="gap-4 px-5 py-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-40" />
        </Card>
      </div>
    </div>
  );
}
