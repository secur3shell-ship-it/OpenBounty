# Components

Our own shared components. For the shadcn ones (`Button`, `Card`, `Badge`, ...) see `src/components/ui/` and the tweaks table in [README.md](README.md).

To see them, run `npm run dev` and open the pages that use them, against devnet. There is no separate component preview page.

## explore/

| Component | What it shows |
|---|---|
| `ExploreBounties` | The bounty part of the home page:<br>• status filter with counts: All, Open, Ending soon, Judging, Ended<br>• sorted grid: running bounties first (soonest next date first: entries closing, then judging ending), then ended ones (most recent first)<br>• loading, empty, filtered-empty and error states<br>• works without a wallet; connecting one adds your role tags |

## markets/

Charts are hand-drawn SVG (no chart library, which keeps pages light) and follow the dataviz rules:
- a 2px line with a 10% area wash, and a solid hairline grid
- round axis ticks
- a crosshair and tooltip that shows the value first
- the same readout from the keyboard, and a text summary twin

| Component | What it shows | Props |
|---|---|---|
| `MarketsView` | The whole `/markets` page. Prices come from `lib/marketData.ts`: CoinGecko from the browser, refreshed every minute (the parked live feed when `NEXT_PUBLIC_MARKET_FEED_URL` is set):<br>• `MarketsStatusLine`, plus a note that prices are for information and prizes are paid in SOL<br>• "Tokens on Solana" and "For reference" cards<br>• `MarketChartPanel` next to `PrizeConverter`, pre-filled with your first SOL prize to claim; bounties load only when a wallet is connected<br>• loading, error (Try again) and "Couldn't refresh, showing the last prices" states | none |
| `MarketsStatusLine` | "Updated 12s ago", the source credit (when the feed reports one), and "Live updates paused. Reconnecting" while the connection is restored | `status`, `updatedAt`, `source`, `hasQuotes` |
| `UpdatedAgo` | "Updated 12s ago". Ticks by itself, so only the label re-renders each second. | `date` |
| `MarketCard` | A token's name, price, 24h change and sparkline. It's a toggle button (`aria-pressed`) that picks the token shown in the big chart; BTC and ETH are tagged "Reference". | `asset`, `quote`, `selected`, `onSelect` |
| `MarketChartPanel` | The selected token's name, price and 24h change, the range buttons (1H, 24H, 7D, 30D) in one row above the chart, then `PriceChart` and `PriceSummary`. **24H and 7D** draw instantly from the quote's hourly prices, with the live price as the last point. **1H and 30D** are fetched from the feed; the old chart stays dimmed (and labelled with what it shows) until they load, and a failed load shows an error with Retry. | `asset`, `quote` |
| `PrizeConverter` | "What's my prize worth?": an amount and token (native radios) give the dollar value plus the equivalent in every other Solana token, at market prices. Informational only: prizes are paid in SOL. It can be pre-filled with a prize waiting to be claimed; render with `key` so a new pre-fill resets it. | `quotes`, `prefill` |
| `PriceChange` | A signed percent with an up or down arrow, green or red (never color alone) | `percent`, `className?` |
| `PriceChart` | Price over time for one token. The left margin is sized to its widest y-axis label.<br>• **Pointer:** crosshair and tooltip<br>• **Keyboard:** Tab in, then ←/→/Home/End; values are announced to screen readers<br>• **End dot:** 8px with a 2px ring<br>• **Loading:** `dimmed` fades the old chart while a new range loads | `points`, `range`, `label`, `dimmed?` |
| `PriceSummary` | Start, high, low, now and change (signed, colored): the text twin of the chart | `points` |
| `Sparkline` | Small decorative 7-day trend line (`aria-hidden`); the numbers beside it carry the meaning | `prices`, `className?` |

Chart helpers are in `src/utils/chart.ts` (`scaleLinear`, `niceTicks`, `formatTick`, `linePath`, time labels). `useElementWidth` measures the chart so it draws at the exact size.

## news/

| Component | What it shows | Props |
|---|---|---|
| `NewsFeed` | "Around Solana" section below the bounties on the home page, from Solana's official RSS (`lib/solanaNews.ts`; the parked feed's `GET /news` if configured): heading, a "Sample" badge only if a source marks its items as samples, a "More news" link to solana.com/news, and a grid of `NewsCard`s with loading, empty and error states | none |
| `NewsCard` | Source and time ago, headline, a 2-line summary and "Read more". The whole card opens the article in a new tab (announced to screen readers). | `item` (`NewsItem`) |
| `NewsCardSkeleton` | Loading placeholder with the same shape | none |

## wallet/

| Component | What it does |
|---|---|
| `WalletModalProvider` | Wraps the app (in `app/providers.tsx`) and renders the picker dialog |
| `useWalletModal()` | `setVisible(true)` opens the picker from anywhere ("Connect wallet" buttons, the create form, the bounty page) |
| Picker dialog | "Connect a wallet": every Wallet Standard wallet found in the browser, with its icon. A spinner shows on the wallet being connected; errors show as a toast. With no wallet installed, it links to Phantom, Solflare and Backpack. It reminds you to switch the wallet to devnet. |

## layout/

| Component | What it does |
|---|---|
| `SiteHeader` | Sticky top bar: logo, nav links, a "Create bounty" button (hidden on phones) and `WalletButton`. Below `md` the links move into `MobileNav`. |
| `MobileNav` | Menu button (phones only) that opens the nav links and "Create bounty" in a left-side sheet. The sheet closes on navigation. |
| `WalletButton` | Logged out: "Connect wallet" opens the wallet picker. While reconnecting: a disabled "Connecting...". Connected: a menu with the wallet name, "devnet", balance, copy address, explorer link, change wallet and disconnect. |
| `SiteFooter` | One-line footer that says the app runs on devnet. A server component (no `"use client"`). |
| `PageHeader` | Page title (`h1`, serif) with an optional description and optional actions on the right. They stack on phones. Use it at the top of every page. |
| `navLinks.ts` | `NAV_LINKS` (Explore, Your bounties, Markets) and `isActivePath()`. Add a page to the nav here and both headers pick it up. |

Page layout: `app/layout.tsx` wraps every page in `<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">`, so pages shouldn't add their own outer container.

`useBalance()` (in `src/hooks/`) returns the connected wallet's balance in lamports, or `null`.

## common/

| Component | What it shows | Props |
|---|---|---|
| `Address` | A shortened address (`AbCd...WxYz`) with the full value in a tooltip and a copy button. The copy button shows a toast. | `address`, `isYou?` (adds a "you" tag), `className?` |
| `TokenAmount` | A SOL amount (lamports) as text, like `12.5 SOL`, in the highlight color, with digits that line up | `amount` (`bigint`), `className?` |
| `EmptyState` | An icon, a title, an optional description and at most one action, for lists with nothing in them | `icon` (lucide icon), `title`, `description?`, `action?` |
| `ErrorState` | A plain-English error with a "Try again" button (`role="alert"`) | `message?`, `onRetry?` |
| `StatCard` | An uppercase label above one value | `label`, `value` (text or a node such as `TokenAmount`) |
| `FormField` | Label, input (children), and helper text that an error replaces (`role="alert"`, red). Give the input `id` and `aria-describedby={messageId(id)}`. | `id`, `label`, `helper?`, `error?`, `children` |
| `FilterButtons` | A row of toggle buttons (`aria-pressed`) with optional counts, which wrap on phones. Used for filters instead of Tabs, because Tabs expect content panels. | `label` (for screen readers), `options` (`{ value, label, count? }[]`), `value`, `onChange` |

## bounty/

| Component | What it shows | Props |
|---|---|---|
| `BountyCard` | Title, status, prize pool, your role, "x of y prizes decided", and the next date ("Entries close in 3 days", "Judging ends in 2 hours", or "Ended 2 days ago"). The whole card links to `/bounty/[address]`. Your own bounties get the ochre glow. | `escrow`, `viewer` (the connected wallet or `null`) |
| `BountyCardSkeleton` | Loading placeholder with the same shape | none |
| `BountyStatusBadge` | "Open" (green), "Ending soon" (ochre), "Judging" (ochre fill), "Ended" (muted). Styles come from `STATUS_STYLES`. | `status` |
| `TierStatusBadge` | "Awaiting votes", "Voting · 2 of 3", "Winner picked", "Claimed", "No winner" (judging ended without a winner), "Unclaimed" (the claim window closed) or "Refunded" | `progress` (from `getTierProgress`), `threshold` |
| `TierCard` | One prize on the Prizes tab: place and amount, status, then the winner or a vote progress bar with each candidate's votes. It says until when the winner can claim, or that the claim window closed. Shows "Vote for a winner" to judges who haven't voted (while judging is open) and "Claim X SOL" to the winner while the claim window is open. A claimed prize links to its claim transaction once `useClaimSignatures` finds it. | `escrow`, `tierIndex`, `viewer`, `pending`, `claimSignature?`, `onVote`, `onClaim` |
| `VoteDialog` | Lets a judge vote on one prize. Candidates come from `getVoteCandidates`: every entry by its project name, plus wallets that already have votes. There's also an address field for any other wallet. It says votes can't be changed. | `open`, `prizeLabel`, `threshold`, `candidates`, `submitting`, `onOpenChange`, `onSubmit(candidate)` |
| `RefundDialog` | Confirms a refund: the amount, which prizes go back, and whether this closes the bounty or leaves prizes locked for winners who can still claim | `open`, `amountText`, `details`, `submitting`, `onOpenChange`, `onConfirm` |
| `BountyDetail` | The whole `/bounty/[address]` page:<br>• loading, error, not-found and "Bounty closed" states<br>• `BountyHeader` and `BountyNotices`<br>• `BountyTabs` next to `BountyDetailsPanel`<br>• the vote and refund dialogs<br><br>It owns the shared handlers (`castVote`, `handleClaim`, `handleRefund`) and refreshes the bounty and its entries together after each transaction. | `address` |
| `BountyTabs` | **Prizes**, **Submissions (N)**, and **Judging** (only for the bounty's judges, with a connected wallet) | `escrow`, `viewer`, `isJudge`, `prizeList`, `entries`, `pending`, `onVote`, `onSubmitEntry`, `onCloseEntry` |
| `BountyHeader` | Back link, status and role badges, title, and "x of y prizes decided · next date" | `escrow`, `status`, `roles` |
| `BountyNotices` | "Connect your wallet" card when logged out. For the organizer: a refund card with the reason and a **Refund X SOL** button when something can be refunded now, and a note saying until when winners can still claim. | `showConnect`, `refundText`, `refundReason`, `upcomingRefund`, `onConnect`, `onRefund` |
| `PrizeList` | The stack of `TierCard`s | `escrow`, `viewer`, `pending`, `claimSignatures`, `onVote`, `onClaim` |
| `BountyDetailsPanel` | Side panel: prize pool and amount still locked, **Entries close**, **Judging ends** and **Claim window** (days and end date), judges with "N of M votes to win" (with their names from the details file, when it has them), organizer, escrow account, and the organizer's details link ("Read the full brief") | `escrow`, `viewer`, `judgeNames?` (defaults to the details file's names) |
| `BountyMetadata` | The organizer's optional details file (`openbounty.metadata.v1`, see `utils/metadata.ts`), between the notices and the tabs: hackathon, longer name, description (plain text, line breaks kept), prize names and extra links (https only, with their host shown). A short warning when the file's judges or prize count differ from the chain; the page always shows the chain's data. Renders nothing for a plain web-page link; a small skeleton while loading and a "Try again" card if the file fails to load (5 s and 256 KB limits). | `escrow` |
| `BountyDetailSkeleton` | Loading placeholder for the detail page | none |
| `RoleBadges` | "You organize", "You judge", "You won". Renders nothing when you have no role. | `roles` (from `getViewerRoles`) |

## submissions/

Bounty entries, stored on-chain. See [../features/judging.md](../features/judging.md).

| Component | What it shows | Props |
|---|---|---|
| `SubmissionGallery` | The "Submissions" tab:<br>• the entry count and when entries close (or closed)<br>• a "Submit entry" button for wallets that may enter, otherwise a note saying why they can't<br>• the grid of entries, with loading, empty and error states<br><br>It owns the submit dialog and the submit and close-entry toasts. | `escrow`, `viewer`, `submissions`, `loading`, `error`, `submitting`, `closing`, `onRetry`, `onSubmitEntry`, `onCloseEntry`, `onSubmitted` |
| `SubmissionCard` | Entry name, submitter (`Address`), time, description, "View project" (safe links only), and "Won 1st prize" or "2 votes · 1st prize" badges. On your own entry, after judging ends: **Close entry, get rent back**. | `submission`, `escrow`, `viewer`, `closing`, `onClose` |
| `SubmitEntryDialog` | Name, link and optional description (with a count against the 280 limit). Validates with `validateSubmission`. | `open`, `submitting`, `onOpenChange`, `onSubmit(values)` |

## judging/

The "Judging" tab, for the bounty's judges only. See [../features/judging.md](../features/judging.md).

| Component | What it shows | Props |
|---|---|---|
| `JudgingBoard` | **Entries** column (sort by Newest or Your score, plus "Compare scores") next to a **Prizes** column. It owns the score, compare and vote-confirm dialogs. | `escrow`, `judge`, `submissions`, `loading`, `pending`, `onVote(tier, candidate)` |
| `BoardCard` | An entry: name, address, your score badge, vote count, **Score**, and **Vote as...** (a menu of the prizes you can still vote on). Draggable while you can vote; the menu is the keyboard and phone alternative. | `submission`, `escrow`, `score`, `voteTiers`, `onScore`, `onVote` |
| `PrizeColumn` | A drop target for one prize: amount, status, progress, the voted entries (winner trophy, "your vote"), and a hint. It accepts drops only while you can still vote on it. | `escrow`, `tierIndex`, `submissions`, `judge`, `isEnded`, `onDropEntry` |
| `VoteConfirmDialog` | "Vote for X as 1st prize?", saying whether this vote picks the winner ("Your vote reaches 3, so it wins...") | `open`, `entryTitle`, `prizeLabel`, `amountText`, `currentVotes`, `threshold`, `submitting`, `onOpenChange`, `onConfirm` |
| `ScoreDialog` | Rate Innovation, Execution and Impact 1–5 (native radios), plus a note. Render it with `key={entry id}`. | `open`, `entryTitle`, `initial`, `onOpenChange`, `onSave` |
| `ScoreCompare` | Table of your scores for every entry, best total first (highlighted), with notes | `open`, `submissions`, `scorecard`, `onOpenChange` |

## me/

| Component | What it shows | Props |
|---|---|---|
| `MyBounties` | The whole `/me` page:<br>• a connect prompt when logged out, plus loading and error states<br>• stats: organizing, judging, SOL ready to claim<br>• to-do sections: "Needs your vote", "Ready to claim" (with the claim-by date), "Refund available", or "Nothing needs you right now"<br>• "Organizing" and "Judging" grids<br>• "Your entries" (`MyEntries`) | none |
| `MyBountiesSkeleton` | Loading placeholder: three stat cards and a row of bounty cards | none |
| `TaskRow` | One to-do: bounty title, prize and amount, and a button that opens the bounty page (where the action happens) | `href`, `title`, `detail`, `actionLabel` |
| `TaskSection` | Heading with a count and a list of `TaskRow`s. Renders nothing when empty. | `title`, `count`, `children` |
| `MyEntries` | "Your entries": every entry you've submitted, newest first, including entries on bounties that have since closed. Owns the close-entry toast. | `viewer`, `state` (from `useMyEntries`) |
| `EntryRow` | One entry: name, its bounty (a link, or "Bounty closed"), status and "Won 1st prize" badges, and "Close entry, get X SOL back" once judging has ended (otherwise when that becomes possible) | `entry`, `viewer`, `rentText`, `closing`, `onClose` |
| `BountyGridSection` | Heading with a count and a grid of `BountyCard`s, or a short note (and optional action) when empty | `title`, `escrows`, `viewer`, `emptyText`, `emptyAction?` |

## create/

The create form is split into sections.

`CreateBountyForm` owns the state, the validation display and the submit:
- **Errors:** they appear only after the first submit attempt, and are recomputed on every render from `validateForm` (no effects).
- **Blank rows:** empty judge and prize rows are ignored.
- **Votes needed:** follows the judge count (a simple majority) until you change it yourself.
- **Logged out:** submit opens the wallet picker.
- **Submitting:** a spinner shows "Confirming...". Success shows `CreateSuccess`; a failure shows a toast from `friendlyTxError`.

The validation rules and the transaction live in `hooks/useCreateBounty.ts`.

| Component | What it shows | Props |
|---|---|---|
| `JudgesField` | Up to 5 judge address inputs (add and remove), plus "Votes needed to pick a winner" with a live "Out of N judges. More than half must agree." hint | `judges`, `threshold`, `judgesError?`, `thresholdError?`, `onJudgesChange`, `onThresholdChange` |
| `PrizeTiersField` | Up to 4 SOL amounts labelled "1st prize", "2nd prize", ..., plus the live total to lock. Amounts are kept as text so a half-typed "0." works. | `amounts`, `error?`, `onChange` |
| `TimelineField` | **Entries close** and **Judging ends** (date and time), and **Claim window (days)**, 1 to 90, default 14. Once all three are valid it shows "Winners can claim until ...". | `submissionsDeadline`, `deadline`, `claimWindowDays`, `errors`, `showSummary`, `onSubmissionsDeadlineChange`, `onDeadlineChange`, `onClaimWindowDaysChange` |
| `CreateSuccess` | Confirmation, an explorer link, and "View bounty" / "Create another" | `signature`, `address`, `onCreateAnother` |
| `MetadataBuilder` | "Bounty details file (optional)", collapsed, under **Details link**: longer name, description, hackathon name and website, `MetadataNamesField`, `MetadataLinksField`, and **Download JSON**, which saves `openbounty-metadata.json` (v1) with the form's current judges and prize count. Nothing is uploaded; the organizer hosts the file and pastes its link. Owns its own state. | `formValues` (`judges`, `tierAmounts`) |
| `MetadataNamesField` | A display name for each valid judge address and a label for each prize in the form | `judges`, `judgeNames`, `prizeCount`, `prizeLabels`, `onJudgeNamesChange`, `onPrizeLabelsChange` |
| `MetadataLinksField` | Up to 5 extra links (label and https, ipfs:// or ar:// URL), add and remove | `links`, `errors?`, `onChange` |

Buttons inside the form that don't submit need `type="button"`; a plain `<button>` inside a `<form>` submits it.

The glow uses the `shadow-glow` class, defined as `--shadow-glow` in `globals.css`.

```tsx
<EmptyState
  icon={Inbox}
  title="No bounties yet"
  description="Bounties you create will show up here."
  action={<Button asChild><Link href="/create">Create bounty</Link></Button>}
/>
```
