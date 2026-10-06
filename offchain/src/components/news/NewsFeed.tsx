"use client";

// Landing-page section below the bounties: the latest news from around the Solana
// ecosystem, from the market feed's news endpoint. Hidden when no feed is configured;
// shows a "Sample" badge while the feed serves sample items.

import { ExternalLink, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import NewsCard from "./NewsCard";
import NewsCardSkeleton from "./NewsCardSkeleton";
import { useNews } from "@/hooks/useNews";

const MORE_NEWS_URL = "https://solana.com/news";

export default function NewsFeed() {
  const { enabled, items, isSample, loading, error, refetch } = useNews();
  if (!enabled) return null;

  function renderItems() {
    if (loading) {
      return (
        <div aria-busy className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <NewsCardSkeleton key={i} />)}
        </div>
      );
    }
    if (error) {
      return <ErrorState message="Couldn't load the latest news. Try again in a moment." onRetry={refetch} />;
    }
    if (items.length === 0) {
      return <EmptyState icon={Newspaper} title="No news right now" description="Check back soon." />;
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => <NewsCard key={item.id} item={item} />)}
      </div>
    );
  }

  return (
    <section aria-labelledby="news-heading" className="flex flex-col gap-6 border-t pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 id="news-heading" className="font-display text-2xl sm:text-3xl">Around Solana</h2>
            {isSample && <Badge variant="outline" className="text-muted-foreground">Sample</Badge>}
          </div>
          <p className="text-muted-foreground">What&apos;s happening across the Solana ecosystem.</p>
        </div>
        <Button asChild variant="outline">
          <a href={MORE_NEWS_URL} target="_blank" rel="noreferrer">
            More news <ExternalLink aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      </div>
      {renderItems()}
    </section>
  );
}
