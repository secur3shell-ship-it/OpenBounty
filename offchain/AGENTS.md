<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## OpenBounty

- This app reads the `openbounty_v2` Solana program on devnet and asks wallets to sign. The program enforces every rule. Never build a backend, database, or anything that has to be trusted.
- Only work inside `offchain/`. The program, `../idl/`, `../tests/` and the root config belong to the on-chain side; ask the owner for changes there.
- `src/generated/openbounty/` is generated from `../idl/openbounty_v2.json` with `npm run generate:client`. Never edit it by hand.
- Never commit or push unless the developer asks. Never put secrets in `NEXT_PUBLIC_*`, and never commit `.env.local`.
- Project context for this app lives in `../doc/` (shared by hand, not in git), starting with `../doc/frontend_next_steps.md`.
