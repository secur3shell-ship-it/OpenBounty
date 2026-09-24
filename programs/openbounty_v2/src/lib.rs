pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("HTvHgRG4uHnj1KQeynNXsKEvBE3oqsc9TxRaGTgqgEk4");

/// OpenBounty: trustless escrow for hackathon prize bounties.
///
/// Entry points only dispatch; all validation and logic live in
/// `instructions/*`.
#[program]
pub mod openbounty_v2 {
    use super::*;

    /// Creates an escrow and funds its complete prize pool atomically.
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        params: InitializeEscrowParams,
    ) -> Result<()> {
        instructions::initialize_escrow::handle_initialize_escrow(ctx, params)
    }

    /// A judge votes for a candidate on one prize tier. The tier finalizes
    /// when a candidate reaches the vote threshold.
    pub fn vote_winner(ctx: Context<VoteWinner>, tier_index: u8, candidate: Pubkey) -> Result<()> {
        instructions::vote_winner::handle_vote_winner(ctx, tier_index, candidate)
    }

    /// The finalized winner of a tier claims its prize.
    pub fn claim_prize(ctx: Context<ClaimPrize>, tier_index: u8) -> Result<()> {
        instructions::claim_prize::handle_claim_prize(ctx, tier_index)
    }

    /// After the deadline, the organizer reclaims an eligible unclaimed tier.
    pub fn refund_unclaimed(ctx: Context<RefundUnclaimed>, tier_index: u8) -> Result<()> {
        instructions::refund_unclaimed::handle_refund_unclaimed(ctx, tier_index)
    }
}
