// "Around Solana" news, read by the browser straight from Solana's official RSS feed
// (solana.com allows cross-site reads). Everything is shown as plain text; only http(s)
// links are kept. Cached for 10 minutes.

import type { NewsFeedData, NewsItem } from "@/types/news";

const RSS_URL = "https://solana.com/news/rss.xml";
const TIMEOUT_MS = 10_000;
const CACHE_MS = 10 * 60_000;
const MAX_ITEMS = 6;
const MAX_SUMMARY = 240;

let cache: { at: number; data: Promise<NewsFeedData> } | null = null;

// RSS descriptions may contain HTML; parse it into a detached document and keep the text
function plainText(html: string): string {
  const text = new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
  return text.replace(/\s+/g, " ").trim();
}

function toItem(node: Element): NewsItem | null {
  const read = (tag: string) => node.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
  const url = read("link");
  const title = plainText(read("title"));
  const publishedAt = new Date(read("pubDate"));
  if (!title || !/^https?:\/\//.test(url) || Number.isNaN(publishedAt.getTime())) return null;
  const summary = plainText(read("description"));
  return {
    id: read("guid") || url,
    title,
    summary: summary.length > MAX_SUMMARY ? `${summary.slice(0, MAX_SUMMARY - 1)}…` : summary,
    url,
    source: "Solana News",
    publishedAt,
  };
}

async function load(): Promise<NewsFeedData> {
  let response: Response;
  try {
    response = await fetch(RSS_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new Error("Couldn't reach Solana News. Try again in a minute.");
  }
  if (!response.ok) throw new Error(`Solana News returned an error (${response.status}). Try again in a minute.`);
  const xml = new DOMParser().parseFromString(await response.text(), "application/xml");
  if (xml.getElementsByTagName("parsererror").length > 0) throw new Error("Solana News sent something we couldn't read.");
  const items = Array.from(xml.getElementsByTagName("item"))
    .map(toItem)
    .filter((item): item is NewsItem => item !== null)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, MAX_ITEMS);
  return { items, isSample: false };
}

/** The newest Solana news items. */
export function fetchSolanaNews(): Promise<NewsFeedData> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  const data = load();
  cache = { at: Date.now(), data };
  data.catch(() => { cache = null; });
  return data;
}
