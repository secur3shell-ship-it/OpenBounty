// Seeds devnet with sample bounties and checks the whole flow on the real network:
// create -> submit entry -> judges vote -> winner claims -> the escrow closes.
// Then it leaves two bounties open for the frontend to show.
//
// Keys: the deployer funds everything. The sample judges and builders are kept in
// ~/.config/openbounty/keys/devnet-*.json (never in the repo) so reruns reuse them.
//
// Usage: yarn seed:devnet
import * as anchor from "@anchor-lang/core";
import { BN, Program, web3 } from "@anchor-lang/core";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import idl from "../target/idl/openbounty_v2.json";
import { OpenbountyV2 } from "../target/types/openbounty_v2";
import { findEscrowPda, findSubmissionPda, findVaultPda } from "../tests/helpers/pda";

const SOL = web3.LAMPORTS_PER_SOL;
const DAY = 24 * 60 * 60;
const KEYS = join(homedir(), ".config/openbounty/keys");

function rpcUrl(): string {
  const config = join(homedir(), ".config/openbounty/solana-cli.yml");
  const fromConfig = existsSync(config)
    ? readFileSync(config, "utf8").match(/^json_rpc_url:\s*"?([^"\s]+)/m)?.[1]
    : undefined;
  const url = fromConfig ?? "https://api.devnet.solana.com";
  if (!url.includes("devnet")) throw new Error("refusing to seed a non-devnet endpoint");
  return url;
}

function loadKey(name: string): web3.Keypair {
  const path = join(KEYS, `${name}.json`);
  if (!existsSync(path)) {
    const key = web3.Keypair.generate();
    writeFileSync(path, JSON.stringify(Array.from(key.secretKey)), { mode: 0o600 });
  }
  return web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
}

async function main() {
  const deployer = loadKey("deployer");
  const connection = new web3.Connection(rpcUrl(), "confirmed");
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(deployer), { commitment: "confirmed" });
  const program = new Program<OpenbountyV2>(idl as OpenbountyV2, provider);
  const organizer = deployer.publicKey;

  const judges = [1, 2, 3].map((i) => loadKey(`devnet-judge-${i}`));
  const builders = [1, 2].map((i) => loadKey(`devnet-builder-${i}`));
  console.log("Organizer:", organizer.toBase58());
  console.log("Judges:   ", judges.map((k) => k.publicKey.toBase58()).join(", "));
  console.log("Builders: ", builders.map((k) => k.publicKey.toBase58()).join(", "));

  // Top up the sample wallets so they can pay fees and entry rent
  const topUp = new web3.Transaction();
  for (const key of [...judges, ...builders]) {
    const balance = await connection.getBalance(key.publicKey);
    if (balance < 0.02 * SOL) {
      topUp.add(web3.SystemProgram.transfer({ fromPubkey: organizer, toPubkey: key.publicKey, lamports: 0.03 * SOL }));
    }
  }
  if (topUp.instructions.length) await provider.sendAndConfirm(topUp);

  async function freeNonce(): Promise<number> {
    for (let nonce = 0; nonce < 256; nonce++) {
      if (!(await connection.getAccountInfo(findEscrowPda(program.programId, organizer, nonce)[0]))) return nonce;
    }
    throw new Error("no free nonce");
  }

  async function create(title: string, prizes: number[], entriesDays: number, deadlineDays: number) {
    const nonce = await freeNonce();
    const now = Math.floor(Date.now() / 1000);
    const signature = await program.methods
      .initializeEscrow({
        nonce,
        title,
        metadataUri: "",
        judges: judges.map((j) => j.publicKey),
        voteThreshold: 2,
        prizeAmounts: prizes.map((p) => new BN(Math.round(p * SOL))),
        submissionsDeadline: new BN(now + entriesDays * DAY),
        deadline: new BN(now + deadlineDays * DAY),
        claimWindow: new BN(14 * DAY),
      })
      .accounts({ organizer })
      .rpc();
    const escrow = findEscrowPda(program.programId, organizer, nonce)[0];
    console.log(`Created "${title}" ${escrow.toBase58()} (${signature})`);
    return { escrow, vault: findVaultPda(program.programId, organizer, nonce)[0] };
  }

  // Reruns reuse an open sample bounty with the same title instead of making another
  async function ensure(title: string, prizes: number[], entriesDays: number, deadlineDays: number) {
    const mine = await program.account.escrow.all([{ memcmp: { offset: 8, bytes: organizer.toBase58() } }]);
    const existing = mine.find((row) => row.account.title === title);
    if (existing) {
      console.log(`Reusing "${title}" ${existing.publicKey.toBase58()}`);
      return { escrow: existing.publicKey, vault: findVaultPda(program.programId, organizer, existing.account.nonce)[0] };
    }
    return create(title, prizes, entriesDays, deadlineDays);
  }

  async function submit(escrow: web3.PublicKey, builder: web3.Keypair, title: string, description: string) {
    const createdAt = (await program.account.escrow.fetch(escrow)).createdAt.toNumber();
    const [entry] = findSubmissionPda(program.programId, escrow, createdAt, builder.publicKey);
    if (await connection.getAccountInfo(entry)) return;
    await program.methods
      .submitEntry(title, `https://github.com/openbounty/${title.toLowerCase().replace(/\W+/g, "-")}`, description)
      .accountsPartial({ submitter: builder.publicKey, escrow })
      .signers([builder])
      .rpc();
    console.log(`  entry "${title}" by ${builder.publicKey.toBase58()}`);
  }

  async function vote(escrow: web3.PublicKey, judge: web3.Keypair, tier: number, candidate: web3.PublicKey) {
    const votes = (await program.account.escrow.fetch(escrow)).prizeTiers[tier].votes;
    if (votes.some((v) => v.judge.equals(judge.publicKey))) return;
    await program.methods
      .voteWinner(tier, candidate)
      .accountsPartial({ judge: judge.publicKey, escrow })
      .signers([judge])
      .rpc();
    console.log(`  vote tier ${tier} -> ${candidate.toBase58()}`);
  }

  // 1. End-to-end check: create, enter, two votes finalize, the winner claims, the escrow closes
  const e2e = await create("Devnet smoke test", [0.01], 3, 7);
  await submit(e2e.escrow, builders[0], "Smoke entry", "Checks the full flow on devnet.");
  await vote(e2e.escrow, judges[0], 0, builders[0].publicKey);
  await vote(e2e.escrow, judges[1], 0, builders[0].publicKey);
  const tier = (await program.account.escrow.fetch(e2e.escrow)).prizeTiers[0];
  if (!tier.winner?.equals(builders[0].publicKey)) throw new Error("tier did not finalize");
  const before = await connection.getBalance(builders[0].publicKey);
  await program.methods
    .claimPrize(0)
    .accountsPartial({ winner: builders[0].publicKey, escrow: e2e.escrow, vault: e2e.vault, organizer })
    .signers([builders[0]])
    .rpc();
  const gained = (await connection.getBalance(builders[0].publicKey)) - before;
  const closed = (await connection.getAccountInfo(e2e.escrow)) === null;
  console.log(`  claimed: winner +${gained / SOL} SOL, escrow closed: ${closed}`);
  if (!closed) throw new Error("escrow should close after the last claim");

  // 2. Samples left open for the UI
  const tracker = await ensure("Build a Solana Wallet Tracker", [0.05, 0.02], 3, 7);
  await submit(tracker.escrow, builders[0], "Pocketwatch", "Tracks balances, NFTs and staking across wallets.");
  await submit(tracker.escrow, builders[1], "SolLens", "A read-only portfolio view with CSV export.");
  await vote(tracker.escrow, judges[0], 0, builders[1].publicKey);

  const design = await ensure("Design System for a DeFi Dashboard", [0.03], 2, 5);
  await submit(design.escrow, builders[1], "Ledgerline UI", "Accessible components for trading screens.");

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
