# OpenBounty

Trustless, on-chain escrow for hackathon prize bounties on Solana.

An organizer locks the full prize pool in a program-controlled vault when the
bounty is created. Judges vote for winners on-chain, each signing their own
transaction. A prize tier finalizes automatically when a candidate reaches the
vote threshold, and the winner claims the prize with no one's approval. After
the deadline, the organizer can reclaim only prize funds that are eligible for
refund.

This repository holds the on-chain program and, in [`offchain/`](offchain/README.md),
the frontend. The frontend is a scaffolded Next.js app built against the
committed IDL (see [Integration boundary](#integration-boundary-idl)); its
features are being built on top of that scaffold.

> **Status: scaffold, deployed on devnet.** The account model, PDAs,
> instruction interfaces, errors and IDL are in place and tested. The program
> is live on devnet (deployed 2026-09-26, upgradeable by the OpenBounty
> deployer), but the four instruction handlers still return `NotImplemented`.
> See [Current limitations](#current-limitations).

## Names

| What                                   | Name            |
| -------------------------------------- | --------------- |
| Project / repository                   | `openbounty`    |
| On-chain program (crate, module, IDL)  | `openbounty_v2` |

The difference is intentional. The program is always `openbounty_v2`.

## Trust model

These are protocol invariants, and the program enforces them. No off-chain
component is trusted to enforce them.

- **Fully backed bounties.** Creating an escrow and funding the whole prize pool
  happen in one instruction. An unfunded or partly funded escrow cannot exist,
  and there is no "deposit later" instruction.
- **The organizer doesn't pick winners.** The organizer creates and funds the
  escrow but cannot vote, pick or override winners, change a finalized winner,
  or withdraw prize funds before the deadline.
- **Judges vote on-chain.** Each judge signs their own vote. There is no
  off-chain signature collection, vote aggregation or relayer.
- **Winners are finalized by the program.** A tier finalizes when a candidate
  reaches `vote_threshold` votes.
- **Winners claim without approval.** The finalized winner claims directly.
  No operator has to approve or release the payout.
- **Refunds only after the deadline.** The organizer can reclaim only eligible,
  unclaimed tiers, and only after the deadline.
- **No admin.** There is no superuser, emergency withdrawal or upgrade-time
  override in the protocol logic.
- **No stored roles.** Roles come from escrow state at instruction time:
  organizer = `escrow.organizer`, judge = signer in `escrow.judges`,
  winner = `prize_tiers[i].winner` of a finalized tier.

## Instructions

| Instruction          | Signer    | Purpose |
| -------------------- | --------- | ------- |
| `initialize_escrow`  | organizer | Creates the escrow and funds the vault with the full prize pool in one step. |
| `vote_winner`        | judge     | Records a judge's vote for a candidate on one tier and finalizes the tier at the threshold. |
| `claim_prize`        | winner    | Pays a finalized tier's prize to its winner. Closes the escrow once every tier is settled. |
| `refund_unclaimed`   | organizer | After the deadline, returns an eligible tier's amount to the organizer. Closes the escrow once every tier is settled. |

## Accounts and PDAs

| Account | Seeds                              | Owner          | Holds |
| ------- | ---------------------------------- | -------------- | ----- |
| Escrow  | `["escrow", organizer, nonce: u8]` | `openbounty_v2` | Bounty state (below) |
| Vault   | `["vault", organizer, nonce: u8]`  | System program | Prize lamports only (no data). The program moves funds by signing with the vault's PDA seeds. |

The `nonce` lets one organizer run up to 256 escrows at the same time. Both
bumps are stored in the escrow.

```text
Escrow
├── organizer        Pubkey        (at byte offset 8, usable in memcmp filters)
├── nonce            u8
├── bump             u8
├── vault_bump       u8
├── vote_threshold   u8
├── deadline         i64           unix seconds
├── title            String        ≤ MAX_TITLE_LENGTH bytes
├── metadata_uri     String        ≤ MAX_METADATA_URI_LENGTH bytes
├── judges           Vec<Pubkey>   ≤ MAX_JUDGES
└── prize_tiers      Vec<PrizeTier> ≤ MAX_PRIZE_TIERS
    ├── amount       u64           lamports
    ├── winner       Option<Pubkey>
    ├── claimed      bool
    ├── refunded     bool
    └── votes        Vec<Vote>     ≤ MAX_JUDGES
        ├── judge     Pubkey
        └── candidate Pubkey
```

The escrow is allocated once at its worst-case size, 1,846 bytes, and is never
resized. A compile-time assertion keeps it under the 10 KiB limit for `init`,
and a unit test checks the size against the protocol limits.

### Protocol limits

All limits are defined in
[`programs/openbounty_v2/src/constants.rs`](programs/openbounty_v2/src/constants.rs):

| Constant                  | Value |
| ------------------------- | ----- |
| `MAX_JUDGES`              | 5     |
| `MAX_PRIZE_TIERS`         | 4     |
| `MAX_TITLE_LENGTH`        | 50    |
| `MAX_METADATA_URI_LENGTH` | 100   |
| `MIN_PRIZE_AMOUNT`        | 1,000,000 lamports (0.001 SOL) |

Each prize tier must also be at least the rent-exempt minimum for a data-less
account (650,240 lamports today). That way paying a brand-new wallet can never
fail on rent, even if rent rises. `MIN_PRIZE_AMOUNT` and the seeds are exported
in the IDL; the `usize` limits aren't (see
[Current limitations](#current-limitations)).

## Repository layout

```text
.
├── programs/openbounty_v2/src/
│   ├── lib.rs                 # entry points only: dispatch to instructions/
│   ├── constants.rs           # seeds and protocol limits
│   ├── error.rs               # OpenBountyError
│   ├── state/                 # Escrow, PrizeTier, Vote (+ sizing tests)
│   └── instructions/          # one file per instruction: accounts + handler
├── tests/
│   ├── openbounty_v2.test.ts  # integration tests (run by `yarn test`)
│   └── helpers/               # shared test utilities (PDA derivation)
├── idl/openbounty_v2.json     # the IDL, refreshed by every build and committed (for the frontend)
├── offchain/                 # the frontend (Next.js + Solana Kit); see offchain/README.md
├── scripts/test-local.sh      # isolated local test run (see "Keys and wallets")
├── Anchor.toml                # toolchain pins, program IDs, clusters, wallet, IDL copy, test guard
├── Cargo.toml                 # Rust workspace
├── rust-toolchain.toml        # host Rust toolchain (IDL build, cargo test)
├── package.json / yarn.lock   # TypeScript test tooling
└── tsconfig.json
```

## Toolchain

Pinned in `Anchor.toml` `[toolchain]` and used for development and testing:

| Component        | Version | Notes |
| ---------------- | ------- | ----- |
| Anchor CLI       | 1.2.0   | via `avm` |
| `anchor-lang`    | =1.2.0  | exact pin; all `anchor-*` crates must match |
| Solana CLI       | 4.1.2   | Agave; the version Anchor 1.2.0's CI tests against |
| Platform tools   | v1.57   | Anchor 1.2.0 default for `anchor build` (SBPF v3) |
| Host Rust        | 1.89.0  | `rust-toolchain.toml` (anchor-lang MSRV) |
| Surfpool         | 1.5.0   | default local network for `anchor test` |
| Node.js          | ≥ 20.18 | developed on 24.x |
| Yarn             | 1.22.x  | `Anchor.toml` `package_manager` |
| `@anchor-lang/core` | 1.2.0 | TS client; matches the CLI |
| TypeScript       | ~6.0.3  | see note below |
| mocha / ts-mocha / ts-node | 11.8 / 11.1 / 10.9 | |

Compatibility notes:

- **Solana CLI.** `avm` 1.2.0's built-in table still recommends Solana 3.1.10
  for Anchor 1.2.0. Anchor's own CI and release image use 4.1.2, so the
  project pins `solana_version = "4.1.2"`, and `avm` then resolves to that.
- **TypeScript 7** (the native compiler) doesn't provide the compiler API that
  ts-node needs, so tests stay on TypeScript 6.x.
- **mocha 12** is outside ts-mocha 11's supported peer range, so mocha stays on
  11.x. It installs with a deprecation warning for its transitive `glob@10`
  (dev-only).
- **SBPF v3.** Anchor 1.2.0 builds SBPF v3 by default. It is active on devnet.
  For a cluster without it, override with `ANCHOR_BUILD_SBF_ARCH`.

## Local development

Prerequisites: Rust (rustup), [avm](https://www.anchor-lang.com/docs/installation)
with Anchor 1.2.0, the Solana CLI, Surfpool, Node.js ≥ 20.18, and Yarn 1.x.

```bash
avm install 1.2.0 && avm use 1.2.0
avm solana install          # installs/activates the Solana version pinned in Anchor.toml
yarn install
```

Then create the OpenBounty wallet and CLI config once per machine (see
[Keys and wallets](#keys-and-wallets)).

### Keys and wallets

OpenBounty never uses `~/.config/solana/id.json` or the global Solana CLI
config (`~/.config/solana/cli/config.yml`). Both belong to other work on the
same machine. All OpenBounty keys live in `~/.config/openbounty/`, outside the
repository:

| Key or file | Location | Role |
| ----------- | -------- | ---- |
| Deployer wallet | `~/.config/openbounty/keys/deployer.json` | `[provider] wallet` in `Anchor.toml`. Pays for local tests and deployments, and is the program's upgrade authority on devnet |
| Solana CLI config | `~/.config/openbounty/solana-cli.yml` | Points the `solana` CLI at our private devnet RPC (its URL holds an API key, so it's never committed) and the deployer. Pass it with `-C` on every OpenBounty `solana` command. `yarn deploy:devnet` reads the RPC URL from it |
| Program keypair | `target/deploy/openbounty_v2-keypair.json` | Defines the program ID (see [Program ID](#program-id)). Gitignored; keep a backup |

One-time setup per machine:

```bash
mkdir -p ~/.config/openbounty/keys && chmod 700 ~/.config/openbounty ~/.config/openbounty/keys
solana-keygen new -o ~/.config/openbounty/keys/deployer.json   # write down the seed phrase
solana config set -C ~/.config/openbounty/solana-cli.yml \
  --url devnet --keypair ~/.config/openbounty/keys/deployer.json --commitment confirmed
```

Rules:

- Never run `solana config set` without `-C ~/.config/openbounty/solana-cli.yml`.
  Without it, the command edits the global config.
- Run OpenBounty `solana` commands as
  `solana -C ~/.config/openbounty/solana-cli.yml <command>`.
- Keep any new authority or key under `~/.config/openbounty/keys/`, never in
  the repository.

### Program ID

The program ID is the public key of `target/deploy/openbounty_v2-keypair.json`.
That keypair is the program's deploy key: it is gitignored and must never be
committed. `anchor build` creates a new one if none exists, and warns when it
doesn't match `declare_id!`.

On a fresh clone, do one of these before running tests:

- **Use the existing program ID:** get the keypair from its owner through a
  secure channel and put it at that path.
- **Use your own ID:** run `anchor keys sync`. It creates a keypair if needed
  and rewrites `declare_id!` and `Anchor.toml` to match. Don't commit that
  rewrite unless the project is changing its program ID.

### Build

```bash
anchor build
```

Produces `target/deploy/openbounty_v2.so`, the IDL at
`target/idl/openbounty_v2.json`, and TS types in `target/types/`.

### Test

```bash
yarn test                    # build, start Surfpool (offline) funded only for the deployer, deploy, run tests
yarn test:legacy             # same, on solana-test-validator
cargo test -p openbounty_v2  # Rust unit tests (account sizing)
yarn typecheck               # type-check the TS tests
```

Don't run plain `anchor test`. Anchor starts Surfpool with its default airdrop
keypair, `~/.config/solana/id.json`, and makes that key the local upgrade
authority, and Anchor 1.2.0 has no setting to change this. A `pre-test` hook in
`Anchor.toml` stops plain `anchor test` before any validator starts.
`yarn test` (`scripts/test-local.sh`) starts Surfpool itself with the
deployer wallet. `yarn test:legacy` funds the deployer through
`solana-test-validator --mint`. Extra arguments go through to `anchor test`,
e.g. `yarn test --skip-build`.

The suites are every `tests/**/*.test.ts`. Put shared helpers in
`tests/helpers/`.

## Devnet

Cluster selection lives only in tooling config, never in program logic.
`Anchor.toml` defaults to `localnet`, and `[programs.devnet]` holds the devnet
program ID.

```bash
anchor build
yarn deploy:devnet      # deploys, or upgrades in place; payer and upgrade authority: the deployer
```

`yarn deploy:devnet` runs [scripts/deploy-devnet.sh](scripts/deploy-devnet.sh):

- It uses the RPC URL from `~/.config/openbounty/solana-cli.yml`. We use a
  private Helius devnet endpoint, because the public
  `https://api.devnet.solana.com` often drops account lookups. The URL
  contains an API key, so it lives only in that file, outside the repo.
- Without that file, the script falls back to the public endpoint.
- It refuses to run against anything that isn't devnet.

To use your own endpoint:

```bash
solana config set -C ~/.config/openbounty/solana-cli.yml --url "<your devnet RPC URL>"
```

The script runs `anchor program deploy` (Anchor 1.2 deprecates the older
`anchor deploy`). The first deploy needs the program keypair described in
[Program ID](#program-id). Upgrades need only the upgrade authority.
Deploying also publishes the IDL on-chain through Program Metadata (skip this
with `--no-idl`). To fund the deployer, run
`solana -C ~/.config/openbounty/solana-cli.yml airdrop 1`, or use
https://faucet.solana.com if the airdrop is rate-limited.

Upgrade authority: on devnet the program stays upgradeable, with the deployer
as its upgrade authority, so it can be iterated on. On mainnet it will be
made immutable (`solana program set-upgrade-authority <PROGRAM_ID> --final`)
after an audit and a verifiable build, so no key can change the rules once
bounties hold real funds.

## Integration boundary (IDL)

The frontend uses **`idl/openbounty_v2.json`**. It lists the instructions,
accounts, types, errors and seed constants, plus the PDA seeds for `escrow`
and `vault`, so clients can derive both addresses.

How the IDL reaches the frontend after every build:

1. Every `anchor build` (and every `yarn test`, which builds first) writes the
   IDL to `target/idl/` and also to `idl/openbounty_v2.json`, because of
   `[workspace] idls = "idl"` in `Anchor.toml`.
2. `idl/` is committed. When the program's interface changes, the IDL change
   is committed together with the program change.
3. The frontend runs `git pull` and regenerates its client from
   `idl/openbounty_v2.json`. Git history shows exactly which program commit
   each IDL came from.

Error codes start at 6000. New variants are only appended, never reordered,
because clients match on the codes. The program keypair is never shared.

## Current limitations

- **Handlers aren't implemented.** The account constraints for all four
  instructions are final: signers, PDA seeds and bumps, and the escrow-to-
  organizer checks. Handler-level checks (judge membership, winner identity,
  deadline, tier state) are still TODOs. Each handler returns
  `NotImplemented`. A failing call rolls back entirely, and a test checks
  that.
- **`NotImplemented` is temporary.** It is the last error variant, and new
  errors are inserted just before it, so removing it later doesn't renumber
  any real error.
- **Protocol rules (decided 2026-09-26, implemented as each handler lands):**
  - Votes are final, and voting closes at the deadline.
  - The vote threshold must be a strict majority of the judges.
  - Invalid candidates: the organizer, any judge, the system program address,
    and the bounty's own escrow and vault. One candidate may win several
    prizes.
  - A finalized prize always belongs to its winner, who can claim it even
    after the deadline. After the deadline (strictly), the organizer can
    refund only prizes that never got a winner.
  - The metadata URI is optional. The deadline must be in the future and at
    most one year away.
  - No vault rent reserve: every prize is at least the empty-account rent
    minimum, and the last settlement sweeps the vault to zero.
  - Each instruction emits Anchor events.
- **Limits aren't in the IDL.** They are `usize`, as account sizing needs,
  and `#[constant]` can't export `usize`. Clients should mirror
  `constants.rs`.
- **The frontend is a scaffold** (wallet, reads, helpers, rules), with its
  features in progress. There is no backend or indexer, by design.
