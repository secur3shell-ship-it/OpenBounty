# OpenBounty UI

Notes on how the frontend is built. Each change updates these docs in the same commit.

**Design rules:** [`.claude/skills/openbounty-ui/SKILL.md`](../../../.claude/skills/openbounty-ui/SKILL.md) covers colors, fonts, pages, components, patterns and code rules. Read it before changing any UI.

**Reference skills:** these come from [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT licensed):
- `ui-ux-pro-max`: a searchable UX and design database
- `design-system`: how design values are layered
- `ui-styling`: shadcn and Tailwind guides

They're third-party tools (Python scripts and data files), so they're **installed locally and not committed**. `.gitignore` lists them. To install them, run from the repo root:

```bash
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill /tmp/ui-ux-pro-max-skill
cp -r /tmp/ui-ux-pro-max-skill/.claude/skills/{ui-ux-pro-max,design-system,ui-styling} .claude/skills/
# The search script assumes a plugin install; point it at the repo instead
sed -i 's|${CLAUDE_PLUGIN_ROOT}/.claude/skills/|.claude/skills/|g' .claude/skills/ui-ux-pro-max/SKILL.md
```

The UI refactor was done with upstream commit `dcc40ff`. The project's own skill (`openbounty-ui`) is committed and doesn't need them to be read. They only add searchable guidance on top.

## Styling

- **Setup:** Tailwind v4 and shadcn/ui (Radix, "nova" preset). The shadcn settings are in `components.json`.
- **Colors and fonts:** `app/globals.css`, in three layers:
  1. Base palette (raw values)
  2. Meanings (shadcn names like `--primary`)
  3. `@theme inline`, which turns the meanings into classes like `bg-primary`
- **In components:** use only the classes, never raw hex values.
- **Fonts:** loaded in `app/layout.tsx` and available as `font-sans` (DM Sans), `font-display` (DM Serif Display) and `font-mono` (JetBrains Mono).
- **Dark only:** `<html>` always has the `dark` class.
- **Native controls:** `color-scheme: dark` on `<html>` makes the date picker and scrollbars dark too.
- **Accessibility, set globally in `globals.css` and `layout.tsx`:**
  - a "Skip to content" link is the first Tab stop
  - links get a solid 2px ochre focus outline
  - the system "reduce motion" setting turns off animations
- **Wallet picker:** our own dialog, `src/components/wallet/WalletModal.tsx`, built on the shadcn `Dialog`, so it already uses our colors and fonts. It lists every Wallet Standard wallet in the browser (Phantom, Solflare, Backpack, ...). Any component opens it with `useWalletModal().setVisible(true)`.
- **Page titles:** each `app/**/page.tsx` exports `metadata.title`, and the layout's template turns it into "Title · OpenBounty".
- **Pages are server components:** they render client components such as `ExploreBounties`, `MyBounties` or `BountyDetail`. That keeps `"use client"` at the leaves, and lets the bounty page return a real 404 for an address that can't be valid.
- **Wallet state only exists in the browser:** wallet-dependent UI waits for `useHydrated()` so the server and browser render the same thing first.
- **`cn()`:** `src/lib/utils.ts` re-exports it from the `cn` package, shadcn's replacement for clsx + tailwind-merge.

### Changes to generated shadcn files

Files in `src/components/ui/` come from `npx shadcn add`. Our edits to them, each marked with an `OpenBounty tweak` comment:

| File | Change | Why |
|---|---|---|
| `button.tsx` | Default and icon sizes are 44px on phones (`h-11`) and compact from `sm` up (`h-9`). `lg` is always 44px. | Touch targets |
| `button.tsx` | `destructive` is a solid red fill with dark text | The tinted version was 3.2–4.4:1 contrast, and the minimum is 4.5:1 |
| `badge.tsx` | `destructive` has no fill: red text and a red border | Same contrast problem |
| `input.tsx` | 44px tall on phones, `h-9` from `sm` up | Touch targets |
| `sonner.tsx` | Theme fixed to dark; `next-themes` removed | The app is dark-only |

If you re-run `shadcn add --overwrite` on these files, apply the tweaks again.

Available now: `alert`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `separator`, `sheet`, `skeleton`, `sonner`, `tabs`, `textarea`, `tooltip`. `TooltipProvider` and `Toaster` are already mounted in `app/layout.tsx`.

## Code map

Amounts are lamports and times are unix seconds, both as `bigint`, exactly as the program stores them.

### Types and constants

| Path | What's there |
|---|---|
| `src/types/escrow.ts` | `EscrowAccount`, `PrizeTier`, `TierVote`: the bounty shape every component uses. A bounty has three dates: `submissionsDeadline` (entries close), `deadline` (judging ends) and `claimDeadline` (end of the claim window). |
| `src/types/submission.ts` | `Submission`: one entry (project name, link, description, submitter, time) |
| `src/constants/program.ts` | Program ID, explorer links (`explorerUrl`, `explorerAddressUrl`), and the program's limits: `MAX_JUDGES`, `MAX_TIERS`, `MAX_TITLE_BYTES`, `MAX_METADATA_URI_BYTES`, `MIN_PRIZE_LAMPORTS`, and the claim window in days (1 to 90, default 14) |
| `src/constants/submissions.ts` | Entry limits in bytes: name 50, link 100, description 280 |
| `src/constants/assets.ts` | The token list (SOL, USDC, USDT, BONK, JUP) used by the Markets page and the prize converter. Prizes are SOL only in v1; other prize tokens are phase 2. |
| `src/constants/markets.ts`, `src/types/market.ts`, `src/types/news.ts` | Markets token list (the tokens above plus BTC and ETH for reference), market and news data shapes |

### Plain logic (`src/utils/`)

| Path | What's there |
|---|---|
| `utils/accounts.ts` | `toEscrowAccount` and `toSubmission`: decoded program accounts → the shapes above |
| `utils/format.ts` | `formatSol` ("12.5 SOL"), `toLamports` (typed SOL → lamports, exact), `formatUsd`, `formatPercent`, `formatUpdatedAgo`, `formatDeadline` ("3 days left", "Ended 2 days ago"), `formatSpan`, `formatTimeAgo`, `formatDate`, `claimWindowDays`, `placeLabel` ("1st prize"), `truncateAddress`, `totalLocked`, `unsettledTotal` (prizes still in the vault) |
| `utils/status.ts` | `getBountyStatus` (open / ending-soon / judging / ended), `isEntriesOpen`, `isVotingOpen`, `isClaimWindowOpen`, `getTierProgress` (awaiting / voting / winner / claimed / no-winner / unclaimed / refunded), `refundableTiers` (what the organizer can refund right now), `pendingWinnerTiers`, `getCandidateTallies`, `countDecidedTiers` |
| `utils/roles.ts` | `getViewerRoles(escrow, wallet)`: is the wallet the organizer, a judge, or a winner (and of which prizes) |
| `utils/tasks.ts` | `getViewerTasks(escrows, wallet)`: prizes to vote on, prizes to claim (claim window still open), bounties with something to refund now, plus the bounties you organize and judge |
| `utils/submissions.ts` | Entries:<br>• `getSubmitBlock` and `SUBMIT_BLOCK_TEXT` (who may enter, and why not)<br>• `validateSubmission` (limits counted in bytes, like the program)<br>• `findSubmission`, `votesPerTier`, `wonTiers`, `getVoteCandidates` (votes point at wallets; these map them onto entries)<br><br>See [../features/judging.md](../features/judging.md). |
| `utils/judging.ts` | `canVoteOnTier` and `votableTiers` (the same checks as `vote_winner`: before judging ends, no winner yet, not voted yet), and `sortEntries` (newest, or by your score) |
| `utils/scorecard.ts` | Judge scorecards: `CRITERIA` (Innovation, Execution, Impact, each 1–5), `scoreTotal` (out of 15, or `null` until all three are rated), `loadScorecard` and `saveScorecard` (`localStorage` under `openbounty:scorecard:<bounty>:<judge>`; every access is guarded) |
| `utils/address.ts` | `parseAddress(text)`: an `Address`, or `null` if the text isn't a valid Solana address. `safeDetailsUrl(uri)`: only `http(s)` and `ipfs://` links (turned into a gateway URL); anything else, such as `javascript:`, is dropped. `byteLength`: UTF-8 length, the unit the program counts in. |
| `utils/chart.ts` | Chart scales, round ticks, SVG paths and time labels |
| `utils/txErrors.ts` | `friendlyTxError(err)`: re-exports `describeError` from `lib/errors.ts`. To add a program error, add a line to `PROGRAM_ERROR_MESSAGES` there (a test fails if one is missing). |
| `utils/txToast.ts` | `toastTxSuccess(message, signature)` (with a "View" explorer action) and `toastTxError(err)` |

### Hooks (`src/hooks/`)

| Hook | What it gives you |
|---|---|
| `useWallet` | The connected wallet: `address` (the "viewer", or `null`), `walletName`, `walletIcon`, `connecting`, `disconnect` |
| `useHydrated` | `false` on the server and during hydration, `true` after |
| `useAsync(key, load)` | `data`, `loading`, `error`, `refetch`. A refetch keeps the old data on screen, so refreshes never flash a skeleton. `key = null` skips loading. |
| `useAllEscrows(enabled?)` | Every bounty on devnet. Works without a wallet; `enabled = false` skips loading. |
| `useEscrow(address)` | One bounty; `null` if it doesn't exist or has closed |
| `useSubmissions(escrow)` | The bounty's entries, newest first, with `loading`, `error` and `refetch` |
| `useBountyActions(escrow)` | `vote(tier, candidate)`, `claim(tier)`, `refund()` (every prize refundable now, in one transaction), `submitEntry(values)`, `closeEntry()`, plus `pending` (`"vote-0"`, `"claim-1"`, `"refund"`, `"submit"`, `"close-entry"`) for spinners. Each action returns the signature or throws; the caller shows the toast. |
| `useCreateBounty` | `createBounty(values)` and `submitting`. The same file exports `validateForm` (instant form checks) and `hasErrors`. `createBounty` checks again against network time and the live rent minimum, finds a free nonce, then sends. |
| `useBalance` | The connected wallet's balance in lamports, or `null` |
| `useMyEntries` | Your entries on every bounty (matched to their bounty, or `null` once it closed), the entry rent, and `closeEntry(entry)` |
| `useClaimSignatures` | tierIndex → claim transaction for a bounty's claimed prizes, read with `lib/history.ts` |
| `useScorecard(bounty, judge)` | `scorecard` and `saveScore` |
| `useMarketQuotes`, `usePriceHistory`, `useNews` | Live prices, chart history and news from the market feed (see [../features/markets-feed.md](../features/markets-feed.md)) |
| `useNow`, `useElementWidth` | A ticking clock for "Updated 12s ago", and an element's width for drawing charts at the exact size |

### Chain access (`src/lib/`) and checks (`src/domain/`)

| Path | What's there |
|---|---|
| `lib/client.ts` | The one Kit client: wallet signer (`client.identity`), RPC (`client.rpc`) and the typed program (`client.openbountyV2`) |
| `lib/queries.ts` | `listAllEscrows`, `listEscrowsByOrganizer`, `fetchEscrowOrNull`, `listSubmissions`, `listSubmissionsBySubmitter`, `findFreeNonce`. Reads use `getProgramAccounts`; there is no indexer. |
| `lib/instructions.ts` | `buildCreateBounty`, `buildVote`, `buildClaim`, `buildRefund`, `buildSubmitEntry`, `buildCloseEntry` |
| `lib/history.ts` | `findClaimSignatures(escrow, since, tiers)`: finds claim transactions in the escrow's history by decoding the program's `PrizeClaimed` events from the logs (no indexer). Transactions older than the bounty's `createdAt` are skipped, because a closed bounty's address can be reused. |
| `lib/pda.ts` | `findEscrowPda`, `findVaultPda`, `findSubmissionPda` |
| `lib/chain.ts` | `networkNow` (use it, not `Date.now()`, for final deadline checks), `getBalanceLamports`, `getRentMinimum` |
| `lib/errors.ts` | Friendly text for every program error and common wallet errors, and `UserFacingError` for messages that are already written for users |
| `lib/config.ts` | RPC URL, wallet chain (`solana:devnet`), explorer cluster |
| `lib/marketFeed.ts` | The socket.io connection and REST calls to the market feed |
| `domain/validation.ts` | `validateCreate`, `voteProblem`, `claimProblem`, `refundProblem`, `minimumPrize`: the program's rules, so users get a clear message before signing. `rules.ts`, `tier.ts` and `roles.ts` hold the limits and small helpers they use. Tests: `domain.test.ts`. |
| `generated/openbounty/` | Generated from `../idl/openbounty_v2.json` with `npm run generate:client`. Never edit by hand. |

## Running

```bash
npm run dev     # http://localhost:3000, against the real program on devnet
```

- There is no mock mode and no test wallet. Connect a real browser wallet switched to devnet; free devnet SOL is at https://faucet.solana.com.
- **Sample data:** the on-chain side runs `yarn seed:devnet` from the repo root to create sample bounties.
- **Every role with one person:** use a few wallets (or accounts in one wallet). Create a bounty with one, add the others as judges, and submit entries from a wallet that is neither.
- **Waiting for dates:** entries close, judging ends and the claim window are real times on devnet. Use short times (the form allows dates 10 minutes ahead, and a 1-day claim window) to see each stage.
- **Markets and news:** set `NEXT_PUBLIC_MARKET_FEED_URL` in `.env.local` to see them; without it the Markets page says prices aren't connected and the news section is hidden.

## Checks

Run these from `offchain/` before calling a change done:

| Command | What it checks |
|---|---|
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint (generated code is ignored) |
| `npm test` | Vitest tests in `src/domain/` |
| `npm run build` | Production build |

Then run the checklist at the end of `.claude/skills/openbounty-ui/SKILL.md`.

## History

- **UI refactor:** shadcn theme, new header and mobile nav, Explore, Create, bounty detail, "Your bounties" (`/me`) and the 404 page, with loading, empty and error states, mobile layouts and accessibility fixes.
- **Deeper brown palette:** same hue, 2–3 points darker. Only the base palette in `globals.css` changed; every text color still passes contrast. The old values are in git history.
- **Entries, judging board and scorecards:** first built as a preview, now real on-chain. See [../features/judging.md](../features/judging.md).
- **Markets page and home-page news:** now fed by the read-only market feed. See [../features/markets-feed.md](../features/markets-feed.md).
- **Move to `@solana/kit`:** web3.js, Anchor's client and wallet-adapter were replaced by Kit, a Codama client generated from the IDL, and our own wallet picker. Mock mode was removed; the app always runs against devnet.
- **Bounty timeline:** each bounty now has entries close, judging ends and a claim window, with matching statuses and refunds.
- **Planned for phase 2:** prizes in other tokens and "claim in any token". See [../features/claim-in-any-token.md](../features/claim-in-any-token.md).
