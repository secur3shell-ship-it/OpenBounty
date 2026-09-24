use anchor_lang::prelude::*;

use crate::{constants::*, error::OpenBountyError, state::Escrow};

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    /// Must equal `prize_tiers[tier_index].winner`. Receives the prize.
    #[account(mut)]
    pub winner: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.organizer.as_ref(), escrow.nonce.to_le_bytes().as_ref()],
        bump = escrow.bump,
        has_one = organizer @ OpenBountyError::OrganizerMismatch,
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        seeds = [VAULT_SEED, escrow.organizer.as_ref(), escrow.nonce.to_le_bytes().as_ref()],
        bump = escrow.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    /// Not a signer. Receives the escrow rent (and any vault remainder) if
    /// this claim settles the last open tier.
    #[account(mut)]
    pub organizer: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_claim_prize(_ctx: Context<ClaimPrize>, _tier_index: u8) -> Result<()> {
    // TODO(claim_prize): implement. The winner needs no approval from the
    // organizer or anyone else.
    //  - Check tier_index (InvalidTier), that the tier has a winner
    //    (TierNotFinalized), that the signer is that winner (NotWinner), and
    //    that the prize is unclaimed (PrizeAlreadyClaimed).
    //  - Mark the tier claimed, then transfer `amount` from the vault with the
    //    vault PDA seeds.
    //  - If every tier is now claimed or refunded, close the escrow and sweep
    //    the vault to the organizer.
    err!(OpenBountyError::NotImplemented)
}
