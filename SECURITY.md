# Security

OpenBounty runs on Solana **devnet** only. The program has **not had an external audit**. Don't use it with real money.

## Reporting a vulnerability

Please report privately through GitHub: open the repository's **Security** tab and click **Report a vulnerability**. Don't open a public issue for a security problem.

Include:
- what an attacker can do;
- the instruction and accounts involved;
- steps or a test that shows it.

We aim to reply within a few days.

## Scope

- The on-chain program `openbounty_v2` (`programs/`), deployed on devnet at `HTvHgRG4uHnj1KQeynNXsKEvBE3oqsc9TxRaGTgqgEk4`.
- The website in `offchain/`, for problems such as unsafe links or misleading transaction prompts.

Markets prices and news come from third parties (CoinGecko, Solana's news feed), so they're out of scope.

## What the program guarantees

The rules are listed in the README under ["Rules the program enforces"](README.md#rules-the-program-enforces). A way to break any of them is a vulnerability. Examples:
- taking money from a vault;
- blocking a winner's claim;
- voting without being a judge;
- refunding a prize before the rules allow it.

## Reviews so far

**October 2026: internal review** of all six instructions. It covered signers, account substitution, arithmetic, time windows, closing and rent, and address reuse.

It found and fixed one issue: an organizer could reassign their own wallet to another program so that every claim failed, and then refund the prizes after the claim window. Claims no longer depend on who owns the organizer's account. A test covers this attack.

## Upgrade authority

On devnet the program can still be upgraded by the project's deployer key ([`Ad5NzuNtFGG5GfWkSA4fkF3yViQiefv96BeESSMURwqk`](https://explorer.solana.com/address/Ad5NzuNtFGG5GfWkSA4fkF3yViQiefv96BeESSMURwqk?cluster=devnet)). That authority is moving to a multisig.
