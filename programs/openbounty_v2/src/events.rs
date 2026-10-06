//! Events emitted by every state change (Q12), so clients and indexers can
//! follow a bounty without polling its account.

use anchor_lang::prelude::*;

#[event]
pub struct EscrowInitialized {
    pub escrow: Pubkey,
    pub organizer: Pubkey,
    pub nonce: u8,
    pub prize_pool: u64,
    pub submissions_deadline: i64,
    pub deadline: i64,
    pub claim_deadline: i64,
}

#[event]
pub struct VoteCast {
    pub escrow: Pubkey,
    pub tier_index: u8,
    pub judge: Pubkey,
    pub candidate: Pubkey,
}

#[event]
pub struct TierFinalized {
    pub escrow: Pubkey,
    pub tier_index: u8,
    pub winner: Pubkey,
}

#[event]
pub struct PrizeClaimed {
    pub escrow: Pubkey,
    pub tier_index: u8,
    pub winner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct TierRefunded {
    pub escrow: Pubkey,
    pub tier_index: u8,
    pub amount: u64,
}

#[event]
pub struct EscrowClosed {
    pub escrow: Pubkey,
}

#[event]
pub struct EntrySubmitted {
    pub escrow: Pubkey,
    pub submission: Pubkey,
    pub submitter: Pubkey,
}

#[event]
pub struct EntryClosed {
    pub escrow: Pubkey,
    pub submission: Pubkey,
    pub submitter: Pubkey,
}
