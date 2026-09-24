use anchor_lang::prelude::*;

use crate::{constants::*, error::OpenBountyError, state::Escrow};

#[derive(Accounts)]
pub struct RefundUnclaimed<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.organizer.as_ref(), escrow.nonce.to_le_bytes().as_ref()],
        bump = escrow.bump,
        has_one = organizer @ OpenBountyError::UnauthorizedOrganizer,
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        seeds = [VAULT_SEED, escrow.organizer.as_ref(), escrow.nonce.to_le_bytes().as_ref()],
        bump = escrow.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_refund_unclaimed(_ctx: Context<RefundUnclaimed>, _tier_index: u8) -> Result<()> {
    // TODO(refund_unclaimed): implement. There is no emergency or admin
    // withdrawal; this is the organizer's only way to recover funds.
    //  - Require Clock::unix_timestamp > deadline (DeadlineNotReached).
    //  - Check tier_index (InvalidTier) and refund eligibility
    //    (RefundNotEligible): never claimed and never refunded.
    //  - Open protocol question: is a tier with a finalized but unclaimed
    //    winner refundable after the deadline, or only tiers that never
    //    reached the threshold?
    //  - Mark the tier refunded, then transfer `amount` from the vault with the
    //    vault PDA seeds.
    //  - If every tier is now claimed or refunded, close the escrow and sweep
    //    the vault to the organizer.
    err!(OpenBountyError::NotImplemented)
}
