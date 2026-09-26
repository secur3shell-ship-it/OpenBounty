# OpenBounty frontend (`offchain/`)

The website for OpenBounty. It reads the `openbounty_v2` program on Solana
**devnet** and asks the user's wallet to sign. There's no backend: the
program enforces every rule, and this app only shows data and builds
transactions.

## Run it

```bash
npm install
cp .env.example .env.local    # then put your own devnet RPC URL in it (optional)
npm run dev                   # http://localhost:3000
```

You need Node.js ≥ 20.18 and a browser wallet (Phantom, Solflare or Backpack)
switched to devnet. Free devnet SOL: https://faucet.solana.com

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app locally |
| `npm run build` | Production build (also type-checks) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript only |
| `npm test` | Unit tests for the plain logic (Vitest) |
| `npm run generate:client` | Regenerate `src/generated/openbounty/` from `../idl/openbounty_v2.json` |

**After every `git pull` that changed `idl/`, run `npm run generate:client`.**
The on-chain side commits the new IDL together with each program change.

## Where things are

| Path | What it is |
|---|---|
| `src/app/` | Pages: `/` (bounty list), `/bounty/[escrow]` (one bounty), plus the layout and providers |
| `src/components/` | UI pieces: `WalletButton`, `BountyList`, `BountyDetail` |
| `src/lib/client.ts` | The one Kit client: wallet + RPC + typed program access (`client.openbountyV2`) |
| `src/lib/queries.ts` | Read bounties: list all, list by organizer, fetch one, find a free nonce |
| `src/lib/instructions.ts` | Build the four program instructions (create, vote, claim, refund) |
| `src/lib/pda.ts` | Escrow and vault addresses from (organizer, nonce) |
| `src/lib/chain.ts` | Network time, balance, rent minimum |
| `src/lib/errors.ts` | Program error code → friendly message |
| `src/lib/format.ts` | SOL formatting and parsing, short addresses, dates, explorer links |
| `src/lib/config.ts` | Settings (RPC URL, network) |
| `src/domain/` | Plain logic with no React: prize status, roles, and the form and action checks (with tests) |
| `src/generated/openbounty/` | Generated from the IDL by Codama. **Don't edit** |

## Rules

- The program is the source of truth. The checks in `src/domain/validation.ts`
  only give early, friendly messages.
- Don't edit anything outside `offchain/`. Ask the project owner for program
  changes.
- Everything starting with `NEXT_PUBLIC_` is visible in the browser: never put
  secrets there, and never commit `.env.local`.
