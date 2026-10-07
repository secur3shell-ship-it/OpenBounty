---
name: openbounty-ui
description: OpenBounty UI rules and design decisions. Use when building, refactoring or reviewing any page, component or style in offchain/.
---

# OpenBounty UI rules

The single source of truth for how the OpenBounty frontend looks and is built. When these rules conflict with a reference skill, these rules win.

> **Status: approved** on 2026-09-25.

## Reference skills

These are third-party, installed locally and not committed; the install steps are in `offchain/docs/ui/README.md`. If they're missing, these rules still apply on their own.

| Skill | Use it for |
|---|---|
| `ui-ux-pro-max` | UX rules (`--domain ux`), stack notes (`--stack shadcn`, `--stack nextjs`), and its pre-delivery checklist before calling a page done. Don't adopt its generic palettes or fonts; the look is decided below. |
| `design-system` | How design values are layered: base values → meaning → component |
| `ui-styling` | shadcn and Tailwind reference. Ignore `tailwind_config_gen.py`: it targets Tailwind v3, and we configure v4 in CSS with `@theme`. |

Run searches from the repo root:
`python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux`

## Stack

- **Framework:** Next.js 16 (App Router) and React 19
- **Styling:** Tailwind v4, configured in `app/globals.css`. There is no `tailwind.config` file.
- **Components:** shadcn/ui, generated into `src/components/ui/`
- **Icons:** `lucide-react`
- **Toasts:** `sonner` (through shadcn)
- **Forms:** plain `useState` with a validate function (like `validateForm` in `useCreateBounty`). No react-hook-form or zod.
- **Solana:** `@solana/kit` with a Codama client generated from `../idl/openbounty_v2.json` (`npm run generate:client`). Wallets come through `@solana/kit-plugin-wallet` (Wallet Standard); the picker is our own dialog, `components/wallet/WalletModal.tsx`, opened with `useWalletModal()`. No web3.js, no Anchor client, no wallet-adapter.
- **Package manager:** npm.

## Look

- **Keep the current identity:** warm dark brown with ochre highlights. The browns were deepened on 2026-09-26 (same hue, 2–3 points darker, slightly richer). The v1 values are in git history if they ever need restoring.
- **Dark theme only for now.** Colors are defined by meaning (below), so a light theme can be added later without touching components.
- **Background:** keep the soft ochre glow at the top of the page. The grain texture stays.
- **Contrast:** every text color below is at least 4.5:1 on both the page and card backgrounds.

### Colors

Base values live in `globals.css` only. Components use the meaning-based names through Tailwind classes such as `bg-card`, `text-muted-foreground` and `border-border`.

| Name (shadcn) | Value | Used for |
|---|---|---|
| `background` | `#130B06` | Page |
| `foreground` | `#F5EFE6` | Main text (17:1) |
| `card` | `#23150C` | Cards, panels |
| `popover` | `#23150C` | Menus, dialogs |
| `primary` | `#C8860A` ochre | Main buttons, active tab, focus ring |
| `primary-foreground` | `#130B06` | Text on ochre (6.4:1) |
| `secondary` / `muted` | `#382214` | Quiet buttons, input backgrounds, tier rows |
| `muted-foreground` | `#C4B49E` | Secondary text (8.8:1 on card) |
| `accent` | ochre at 15% | Hover backgrounds, selected items |
| `accent-foreground` | `#F0C060` | Text on accent |
| `destructive` | `#E06C52` | Errors, refund, danger. Button text uses `#130B06` (6.0:1). |
| `success` (custom) | `#9DBD72` | Claimed, winner, success toasts |
| `highlight` (custom) | `#F0C060` | SOL amounts, key numbers |
| `border` / `input` | brown `#623D22` at 55% | All borders |
| `ring` | `#C8860A` | Keyboard focus |

Rules:
- No hex values or `style={{}}` color objects in components. The one exception for inline `style`: positions computed at runtime, such as a chart tooltip following the pointer (`style={{ left }}`). Never colors.
- Never fade text with `opacity`; use `text-muted-foreground`.
- `#825B40` (brown-600) is for borders and dividers only. It's too faint for text.

### Type

| Role | Font | Notes |
|---|---|---|
| Page and card titles | DM Serif Display | The only serif. Playfair Display is removed. |
| Everything else | DM Sans | Body, labels, buttons |
| SOL amounts, counts | DM Sans semibold, `tabular-nums` | Digits line up in lists |
| Addresses, signatures | JetBrains Mono | Replaces Courier New |

- **Sizes:** use Tailwind's scale. Body is `text-base` (16px); `text-sm` for secondary text. `text-xs` (12px) is the minimum and only for labels and meta.
- **Uppercase labels:** `text-xs font-semibold uppercase tracking-wider text-muted-foreground`

### Spacing and shape

- **Spacing:** Tailwind's 4px scale.
- **Page container:** `mx-auto max-w-6xl px-4 sm:px-6`. Vertical rhythm is `py-10` for pages, `gap-8` between sections and `gap-4` inside them.
- **Corners:** `--radius: 0.625rem` (10px), shadcn's default. Cards use `rounded-xl` and controls `rounded-md`.
- **Shadows:** cards use a border and `bg-card`, not heavy shadows. The ochre glow is only for the organizer's own cards.

## Pages

| Route | Page | Status |
|---|---|---|
| `/` | **Explore:** all bounties, filter by Open, Ending soon, Judging or Ended. Below them, the **"Around Solana"** news section (real items from Solana's RSS). | Live |
| `/bounty/[address]` | **Bounty detail:** tabs **Prizes** (tiers with vote progress), **Submissions** (entries) and **Judging** (only for that bounty's judges), next to a panel with the three dates, judges and organizer. Actions depend on your role: submit or close an entry (builder), vote (judge), claim (winner, within the claim window), refund (organizer, once something is refundable). | Live |
| `/create` | **Create bounty** form: basics, judges, SOL prizes, and the timeline (entries close, judging ends, claim window) | Live |
| `/me` | **Your bounties:** "Needs your vote", "Ready to claim", "Refund available", "Organizing", "Judging" | Live |
| `/markets` | **Markets:**<br>• live prices, 24h change and sparklines for Solana tokens, plus BTC and ETH for reference<br>• a big chart (1H, 24H, 7D, 30D)<br>• the "What's my prize worth?" converter<br><br>Prices come from CoinGecko's free API, called by the browser and refreshed every minute ("Price data from CoinGecko" is credited). The real-time feed backend (`offchain/docs/features/markets-feed.md`) is parked; setting `NEXT_PUBLIC_MARKET_FEED_URL` would switch to it. | Live |
| not found | `app/not-found.tsx` with a link home | Live |

### Status names users see

- **Bounty:** `Open` (entries open), `Ending soon` (entries close within 24 hours), `Judging` (entries closed, judges voting), `Ended` (judging over).
- **Tier:** `Awaiting votes`, `Voting · 2 of 3`, `Winner picked`, `Claimed`, `No winner` (judging ended before any candidate got enough votes), `Unclaimed` (the winner didn't claim before the claim window ended), or `Refunded`.
- There is no "Closed" status for a whole bounty: the program closes a bounty once every tier is claimed or refunded, and it disappears from the app.

## Components

### shadcn components used

`button`, `card`, `badge`, `input`, `label`, `textarea`, `tabs`, `dialog`, `dropdown-menu`, `sheet` (mobile menu), `sonner`, `skeleton`, `progress`, `tooltip`, `separator`, `alert`.

Treat files in `src/components/ui/` as generated: change them only for theme-wide tweaks, and note the change in the docs.

### Our own components

| Folder | Contents |
|---|---|
| `components/layout/` | `SiteHeader`, `MobileNav`, `SiteFooter`, `PageHeader`, `WalletButton` (dropdown), `navLinks.ts` |
| `components/wallet/` | `WalletModal.tsx`: the wallet picker dialog and `useWalletModal()` |
| `components/common/` | `Address` (shortened, with a copy button), `TokenAmount`, `EmptyState`, `ErrorState`, `StatCard`, `FormField`, `FilterButtons` |
| `components/explore/` | `ExploreBounties` |
| `components/bounty/` | `BountyDetail`, `BountyHeader`, `BountyNotices`, `BountyTabs`, `BountyDetailsPanel`, `BountyCard`, `BountyStatusBadge`, `TierCard`, `TierStatusBadge`, `PrizeList`, `RoleBadges`, `VoteDialog`, `RefundDialog`, skeletons |
| `components/submissions/` | `SubmissionGallery`, `SubmissionCard`, `SubmitEntryDialog` |
| `components/judging/` | `JudgingBoard`, `BoardCard`, `PrizeColumn`, `ScoreDialog`, `ScoreCompare`, `VoteConfirmDialog` |
| `components/me/` | `MyBounties`, `TaskSection`, `TaskRow`, `BountyGridSection`, skeleton |
| `components/create/` | `CreateBountyForm`, split into `JudgesField`, `PrizeTiersField`, `TimelineField`, plus `CreateSuccess` |
| `components/markets/`, `components/news/` | The Markets page and the "Around Solana" news section |

Details and props for each are in `offchain/docs/ui/components.md`.

## Patterns

- **Amounts are SOL only in v1.** Prizes are lamports (`bigint`), straight from the program.
  - Show amounts with `TokenAmount` or `formatSol(lamports)`.
  - Parse typed amounts with `toLamports`, which is exact (no floating point).
  - Prizes in other tokens are planned for phase 2 (`offchain/docs/features/claim-in-any-token.md`).

- **Data comes from devnet.** There is no mock mode and no backend for bounties or votes; the only server is the read-only market and news feed. Reads go through the hooks in `src/hooks/`, transactions through `useBountyActions` and `useCreateBounty`.

- **Three states for every data view:**
  - **Loading:** a `Skeleton` shaped like the real content, never a blank screen.
  - **Empty:** `EmptyState` with a short message and one action ("No bounties yet" → Create bounty).
  - **Error:** `ErrorState` with a plain-English message and a Retry button.
- **Transactions:**
  - **While pending:** the button disables and shows a spinner with "Confirming…".
  - **On success:** a toast with an explorer link (`toastTxSuccess`).
  - **On failure:** a toast with a plain-English message (`toastTxError`). Program errors are mapped in one place, `lib/errors.ts` (`utils/txErrors.ts` re-exports it).
  - The page never freezes.
- **Forms:**
  - Every field has a visible label, never a placeholder alone.
  - Helper text sits under the field. An error replaces the helper text, in `text-destructive`, with `role="alert"`.
  - Errors show after the first submit attempt, then update live.
  - Submit shows loading, then the result.
- **Icons:** `lucide-react` only, no emoji. An icon-only button needs an `aria-label`.
- **Accessibility:**
  - Every interactive element shows a visible focus ring (shadcn default).
  - Touch targets are at least 44×44px on mobile: buttons and inputs already are, through the shadcn tweaks. Small inline helpers, such as the copy button in `Address`, may be smaller but never under 24×24px (WCAG AA).
  - Status is never shown by color alone; badges always have text.
- **Motion:** transitions are 150–200ms on hover and focus only. Wrap anything larger in `motion-safe:`.
- **Responsive:**
  - Build for mobile first, then add `sm:`, `md:` and `lg:`.
  - Check at 375, 768, 1024 and 1440px, with no sideways scroll.
  - On mobile the header navigation moves into a `Sheet`.
- **Server vs client:** add `"use client"` only where hooks or events are needed. Wallet-dependent pages are client components; keep static parts such as the footer on the server.

## Code rules

- Function components with a named `Props` interface, one component per file, files under about 200 lines.
- Early returns, no nested ternaries, no clever generics or abstractions.
- Tailwind classes written directly. Use `cn()` only to merge conditional classes.
- For our own variants, use a plain object map (for example `STATUS_STYLES[status]`); `cva` stays inside shadcn files.
- Each component file starts with a one-line comment saying what it's for.
- Update `offchain/docs/ui/` in the same commit as the change.
- Test every screen with `npm run dev` against devnet, with a real wallet (see "Running" in `offchain/docs/ui/README.md`).

## Before calling a page done

1. Loading, empty and error states exist.
2. Keyboard only: everything can be reached and the focus ring is visible.
3. Checked at 375px and 1440px widths.
4. No hex colors, inline `style` (except computed positions) or emoji in the new code.
5. `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` pass (run them in `offchain/`).
