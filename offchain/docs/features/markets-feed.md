# Market feed: what the backend must serve

> **Status: PARKED (owner's decision, 2026-10-07).** Don't build the backend until the owner says so. Today the app gets prices from CoinGecko and news from Solana's RSS straight from the browser (`src/lib/marketData.ts`). This page stays as the spec: the frontend client (`src/lib/marketFeed.ts`) is kept, and setting `NEXT_PUBLIC_MARKET_FEED_URL` switches the app over with no code change. The build plan is in `doc/markets_feed_plan.md` (Pyth prices, Solana RSS news, `feed/` folder).

## In one paragraph

The Markets page and the "Around Solana" news on the home page need live prices, chart history and news. The browser never calls a price service itself and never polls. Instead it opens **one socket.io connection** to our own **read-only** market feed, gets a **snapshot** of every price, then receives **pushed updates** as prices move. Chart history and news are plain `GET` requests to the same server. The feed holds any API keys for the price and news services; nothing secret ever reaches the browser.

Nothing on-chain depends on this feed. It only shows information; bounties, votes and claims work without it.

## Turning it on

Set the feed's origin in `offchain/.env.local`:

```
NEXT_PUBLIC_MARKET_FEED_URL=http://localhost:4000
```

- **Origin only**, no path and no trailing slash (socket.io would read a path as a namespace).
- **Not set:** the Markets page shows "Live prices aren't connected yet" and the news section on the home page is hidden. No errors.

## Tokens

The feed serves these ids, exactly as written (from `src/constants/markets.ts`):

| Id | Token | Shown as |
|---|---|---|
| `SOL` | Solana | Token on Solana |
| `USDC` | USD Coin | Token on Solana |
| `USDT` | Tether USD | Token on Solana |
| `BONK` | Bonk | Token on Solana |
| `JUP` | Jupiter | Token on Solana |
| `BTC` | Bitcoin | Reference |
| `ETH` | Ethereum | Reference |

All prices are in **US dollars**, as JSON numbers. Times are **ISO 8601 strings in UTC** (`"2026-10-06T14:03:21.000Z"`), except chart points, which use unix milliseconds.

## 1. Live prices (socket.io)

- **Namespace:** `/markets`, default socket.io path (`/socket.io`).
- **Transport:** the browser connects with **WebSocket only** (no long-polling), so the server needs no sticky sessions.
- **The browser sends nothing.** There are no client events; ignore anything it sends.

### `snapshot` (server → browser)

Send it **right after every connection** (including reconnections). Send it again to everyone **at least once an hour**, so the 7-day trend lines move on.

```ts
{
  updatedAt: string,                 // ISO time of these prices
  source?: { name: string, url: string },   // optional; credited on the page as "Price data from <name>"
  quotes: {
    [id in "SOL" | "USDC" | "USDT" | "BONK" | "JUP" | "BTC" | "ETH"]?: {
      price: number,                 // current USD price
      change24h: number | null,      // percent change over 24h, e.g. -0.62 (null if unknown)
      sparkline7d: number[]          // hourly USD prices for the last 7 days, oldest first
    }
  }
}
```

- `sparkline7d` has one price per hour, about **169 values** (7 × 24 + 1). The **last value is for the start of the current hour** (`updatedAt` rounded down to the hour); the one before it is an hour earlier, and so on.
- A token missing from `quotes` simply isn't shown. Bad values (not a positive number) are skipped.
- The browser **replaces everything** with each snapshot.

### `quote` (server → browser)

Send it whenever a token's price changes.

```ts
{
  id: "SOL",           // one of the ids above
  price: number,       // current USD price
  change24h: number | null,
  at: string           // ISO time of this price
}
```

- **At most one `quote` per token per second.** Skip the event if the price didn't change.
- The browser keeps the token's sparkline and draws the new price as the last point of the 24H and 7D charts.
- An update older than the one the browser already has is ignored.

### What the browser does with the connection

- Opens the socket when the Markets page mounts; closes it 5 seconds after the page is left.
- If the connection drops, it keeps showing the last prices with "Live updates paused. Reconnecting", and socket.io reconnects by itself. The next `snapshot` brings everything up to date.
- If the very first connection fails, it shows an error with **Try again**.

## 2. Chart history (REST)

```
GET /markets/history?id=SOL&range=1H
```

| `range` | Covers | Suggested spacing |
|---|---|---|
| `1H` | the last hour | 1 minute (or 5) |
| `24H` | the last 24 hours | 5 minutes (or hourly) |
| `7D` | the last 7 days | hourly |
| `30D` | the last 30 days | hourly or 4-hourly |

Today the browser only asks for **`1H` and `30D`**: 24H and 7D are drawn from `sparkline7d`. Serving all four keeps the option open.

**Reply (200):**

```ts
{
  id: "SOL",
  range: "1H",
  points: [number, number][]    // [unixMs, usdPrice], oldest first
}
```

- At least 2 points, or the chart says "Not enough data for this range yet".
- **Unknown `id` or `range`:** `400`. The page shows "This data isn't available right now" with Retry.
- **Too many requests:** `429`. The page says the feed is busy.
- The browser caches replies for 30 seconds (1H) or 5 minutes (30D), and gives up after 10 seconds. Cache upstream calls on the server too; many visitors share the same history.

## 3. News (REST)

```
GET /news
```

**Reply (200):**

```ts
{
  items: {
    id: string,            // stable, unique
    title: string,
    summary: string,       // one or two sentences; shown clamped to 2 lines
    url: string,           // http(s) link to the article; anything else is dropped
    source: string,        // e.g. "Solana News"
    publishedAt: string    // ISO time
  }[],
  isSample?: boolean       // true while serving sample items; the page shows a "Sample" badge
}
```

- Send about **6 items**, newest first. The page shows them in a grid of 3 per row.
- An empty list shows "No news right now".
- The browser caches the reply for 5 minutes.

## Rules for the server

- **Read-only.** No writes, no accounts, no database the app depends on.
- **No auth.** Everything is public information.
- **CORS:** allow the frontend's origin (e.g. `http://localhost:3000` and the deployed site) for both REST and socket.io. `GET` only.
- **No keys in the browser.** API keys for price or news services stay on the server, in its own env file (never a `NEXT_PUBLIC_` variable).
- **Errors as JSON:** `{ "error": "plain message" }` with a 4xx or 5xx status. Never send stack traces.
- **Credit the source.** If the price service asks for attribution, send it in `snapshot.source`.

## Where the code is

| File | Purpose |
|---|---|
| `src/lib/marketFeed.ts` | The client: shared socket and price store, history and news fetchers, input checks, friendly errors |
| `src/hooks/useMarketQuotes.ts` | Live quotes, connection status and freshness, without flashing on updates |
| `src/hooks/usePriceHistory.ts` | 1H and 30D chart history; keeps the old chart dimmed while a new one loads |
| `src/hooks/useNews.ts` | News for the home page |
| `src/utils/chart.ts` | Turns `sparkline7d` plus the live price into 24H and 7D chart points |
| `src/constants/markets.ts`, `src/types/market.ts`, `src/types/news.ts` | Token list and types |
| `src/components/markets/`, `src/components/news/` | The Markets page and the news section |
