import * as anchor from "@anchor-lang/core";
import { BN, Program, web3 } from "@anchor-lang/core";
import assert from "node:assert/strict";

import idl from "../target/idl/openbounty_v2.json";
import { OpenbountyV2 } from "../target/types/openbounty_v2";
import { findEscrowPda, findVaultPda } from "./helpers/pda";

describe("openbounty_v2 scaffold smoke test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.openbountyV2 as Program<OpenbountyV2>;
  const organizer = provider.wallet.publicKey;

  it("is deployed as an executable program", async () => {
    const info = await provider.connection.getAccountInfo(program.programId);
    assert.ok(info, "program account not found");
    assert.equal(info.executable, true);
  });

  // Checks the raw IDL JSON (the frontend integration artifact); the TS
  // client camel-cases names at runtime.
  it("exposes the four protocol instructions in its IDL", () => {
    assert.equal(idl.metadata.name, "openbounty_v2");
    assert.equal(idl.address, program.programId.toBase58());
    assert.deepEqual(
      idl.instructions.map((ix) => ix.name).sort(),
      ["claim_prize", "initialize_escrow", "refund_unclaimed", "vote_winner"]
    );
  });

  it("derives distinct escrow and vault PDAs per organizer nonce", () => {
    const [escrow0] = findEscrowPda(program.programId, organizer, 0);
    const [escrow1] = findEscrowPda(program.programId, organizer, 1);
    const [vault0] = findVaultPda(program.programId, organizer, 0);

    assert.ok(!escrow0.equals(escrow1));
    assert.ok(!escrow0.equals(vault0));
  });

  it("resolves the same PDAs from IDL seed metadata", async () => {
    const nonce = 7;
    const pubkeys = await program.methods
      .initializeEscrow(initializeParams(nonce))
      .accounts({ organizer })
      .pubkeys();

    assert.ok(pubkeys.escrow?.equals(findEscrowPda(program.programId, organizer, nonce)[0]));
    assert.ok(pubkeys.vault?.equals(findVaultPda(program.programId, organizer, nonce)[0]));
  });

  // Scaffold-only: replace with real initialization tests once
  // initialize_escrow is implemented.
  it("dispatches initialize_escrow and rolls back on NotImplemented", async () => {
    const nonce = 0;
    await assert.rejects(
      program.methods.initializeEscrow(initializeParams(nonce)).accounts({ organizer }).rpc(),
      (err: unknown) => {
        assert.ok(err instanceof anchor.AnchorError, `unexpected error: ${err}`);
        assert.equal(err.error.errorCode.code, "NotImplemented");
        return true;
      }
    );

    const [escrow] = findEscrowPda(program.programId, organizer, nonce);
    assert.equal(await provider.connection.getAccountInfo(escrow), null);
  });

  function initializeParams(nonce: number) {
    return {
      nonce,
      title: "OpenBounty smoke test",
      metadataUri: "https://example.com/bounty.json",
      judges: [web3.Keypair.generate().publicKey],
      voteThreshold: 1,
      prizeAmounts: [new BN(web3.LAMPORTS_PER_SOL)],
      deadline: new BN(Math.floor(Date.now() / 1000) + 3600),
    };
  }
});
