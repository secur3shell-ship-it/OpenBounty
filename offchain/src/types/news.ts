// One news item in the landing-page feed.

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;          // http(s) only; opens in a new tab
  source: string;       // e.g. "Solana News"
  publishedAt: Date;
}

// What the news endpoint returns, after parsing
export interface NewsFeedData {
  items: NewsItem[];
  isSample: boolean;    // true while the feed serves sample items (shows a "Sample" badge)
}
