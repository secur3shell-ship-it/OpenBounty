# OpenBounty frontend (`offchain/`)

The website for OpenBounty. It reads the `openbounty_v2` program on Solana
**devnet** and asks the user's wallet to sign. There's no backend for bounties
or votes: the program enforces every rule, and this app only shows data and
builds transactions. The one server it can talk to is the owner's read-only
market and news feed (see [docs/features/markets-feed.md](docs/features/markets-feed.md)).

**Program ID (devnet):** [`HTvHgRG4uHnj1KQeynNXsKEvBE3oqsc9TxRaGTgqgEk4`](https://explorer.solana.com/address/HTvHgRG4uHnj1KQeynNXsKEvBE3oqsc9TxRaGTgqgEk4?cluster=devnet).
The app takes it from the generated client (`OPENBOUNTY_V2_PROGRAM_ADDRESS`), so it changes only when
`../idl/openbounty_v2.json` changes.

## Run it

```bash
npm install
cp .env.example .env.local    # then put your own devnet RPC URL in it (optional)
npm run dev                   # http://localhost:3000
```

You need Node.js ≥ 20.18 and a browser wallet (Phantom, Solflare or Backpack)
switched to devnet. Free devnet SOL: https://faucet.solana.com

There's no mock mode: the app always uses the real program on devnet. To get
sample bounties there, the on-chain side runs `yarn seed:devnet` from the repo
root.

### Settings (`.env.local`)

| Variable | What it does |
|---|---|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Devnet RPC. The public URL works but is slow; use your own provider URL. |
| `NEXT_PUBLIC_MARKET_FEED_URL` | Origin of the market and news feed. Leave it unset and the Markets page says live prices aren't connected, and the home-page news is hidden. |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app locally |
| `npm run build` | Production build (also type-checks) |
| `npm run lint` | ESLint (generated code is skipped) |
| `npm run typecheck` | TypeScript only |
| `npm test` | Unit tests for the plain logic (Vitest) |
| `npm run generate:client` | Regenerate `src/generated/openbounty/` from `../idl/openbounty_v2.json` |

**After every `git pull` that changed `idl/`, run `npm run generate:client`.**
The on-chain side commits the new IDL together with each program change.

## Where things are

| Path | What it is |
|---|---|
| `src/app/` | Pages: `/` (Explore and news), `/bounty/[address]` (one bounty), `/create`, `/me` (your bounties), `/markets`, plus the layout, providers and 404 page |
| `src/components/` | UI, one folder per area (`bounty/`, `submissions/`, `judging/`, `create/`, `me/`, `markets/`, ...). The wallet picker is `wallet/WalletModal.tsx`. See [docs/ui/components.md](docs/ui/components.md). |
| `src/hooks/` | Data and action hooks: `useWallet`, `useAllEscrows`, `useEscrow`, `useSubmissions`, `useBountyActions`, `useCreateBounty`, ... |
| `src/utils/` | Plain helpers with no chain access: formatting, statuses, roles, to-dos, entries, judging, scorecards, charts, toasts |
| `src/lib/client.ts` | The one Kit client: wallet + RPC + typed program access (`client.openbountyV2`) |
| `src/lib/queries.ts` | Read bounties and entries: list all, list by organizer, fetch one, list a bounty's entries, find a free nonce |
| `src/lib/instructions.ts` | Build the six program instructions (create, vote, claim, refund, submit entry, close entry) |
| `src/lib/pda.ts` | Escrow and vault addresses from (organizer, nonce); entry addresses from (escrow, its creation time, submitter) |
| `src/lib/chain.ts` | Network time, balance, rent minimum |
| `src/lib/errors.ts` | Program and wallet errors → friendly message |
| `src/lib/config.ts` | Settings (RPC URL, network) |
| `src/lib/marketFeed.ts` | The connection to the read-only market and news feed |
| `src/domain/` | Checks that mirror the program (create, vote, claim, refund), with tests |
| `src/generated/openbounty/` | Generated from the IDL by Codama. **Don't edit** |

## Rules

- The program is the source of truth. The checks in `src/domain/validation.ts`
  and the form checks only give early, friendly messages.
- Never add a backend for bounty state, votes or funds. The market feed is
  read-only and nothing on-chain depends on it.
- The program, `../idl/` and `../tests/` are the on-chain side. Change them
  only when a feature needs it, and keep `../idl/` in the same change.
- Everything starting with `NEXT_PUBLIC_` is visible in the browser: never put
  secrets there, and never commit `.env.local`.
