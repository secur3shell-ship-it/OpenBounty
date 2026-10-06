<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## OpenBounty

- This app reads the `openbounty_v2` Solana program on devnet and asks wallets to sign. The program enforces every rule. Never build a backend, database, or anything that has to be trusted for bounty state, votes or funds. The one exception is the owner's read-only markets/news feed (`NEXT_PUBLIC_MARKET_FEED_URL`, contract in `docs/features/markets-feed.md`).
- No mock mode and no fake transactions. Test against devnet; `yarn seed:devnet` (repo root) creates sample bounties.
- UI rules: `../.claude/skills/openbounty-ui/SKILL.md`.
- The program, `../idl/`, `../tests/` and the root config are the on-chain side; change them together with the frontend only when a feature needs it, and keep `../idl/` in the same change.
- `src/generated/openbounty/` is generated from `../idl/openbounty_v2.json` with `npm run generate:client`. Never edit it by hand.
- Never commit or push unless the developer asks. Never put secrets in `NEXT_PUBLIC_*`, and never commit `.env.local`.
- Project context lives in `../doc/` (not in git): `../doc/plan_v2.md` is the current plan.
