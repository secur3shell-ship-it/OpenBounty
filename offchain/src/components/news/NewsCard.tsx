// One news item: source and time, headline and a short summary. Opens the article in a new tab.

import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { NewsItem } from "@/types/news";
import { formatTimeAgo } from "@/utils/format";

interface Props {
  item: NewsItem;
}

export default function NewsCard({ item }: Props) {
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="group rounded-xl">
      <Card className="h-full gap-3 px-5 py-5 transition-shadow duration-200 group-hover:ring-primary/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {item.source} ·{" "}
          <time dateTime={item.publishedAt.toISOString()}>{formatTimeAgo(item.publishedAt)}</time>
        </p>
        <h3 className="font-display text-lg leading-snug">{item.title}</h3>
        <p className="line-clamp-2 text-muted-foreground">{item.summary}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 text-sm text-primary">
          Read more <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </span>
      </Card>
    </a>
  );
}
