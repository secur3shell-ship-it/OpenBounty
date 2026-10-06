// Loading placeholder for "Your bounties": the three stat cards and a row of bounty cards.

import { Skeleton } from "@/components/ui/skeleton";
import BountyCardSkeleton from "@/components/bounty/BountyCardSkeleton";

export default function MyBountiesSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <BountyCardSkeleton key={i} />)}
      </div>
    </>
  );
}
