// Loading placeholder shaped like a NewsCard.

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewsCardSkeleton() {
  return (
    <Card className="gap-3 px-5 py-5" aria-hidden>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-6 w-5/6" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </Card>
  );
}
