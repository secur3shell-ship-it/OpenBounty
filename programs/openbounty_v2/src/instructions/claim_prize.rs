use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::OpenBountyError,
    events::PrizeClaimed,
    instructions::vault::{close_if_settled, pay_from_vault},
    state::Escrow,
};

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

pub fn handle_claim_prize(ctx: Context<ClaimPrize>, tier_index: u8) -> Result<()> {
    let winner = ctx.accounts.winner.key();
    let escrow_key = ctx.accounts.escrow.key();
    let now = Clock::get()?.unix_timestamp;

    let escrow = &mut ctx.accounts.escrow;
    let claim_deadline = escrow.claim_deadline;
    let tier = escrow
        .prize_tiers
        .get_mut(tier_index as usize)
        .ok_or(OpenBountyError::InvalidTier)?;
    let tier_winner = tier.winner.ok_or(OpenBountyError::TierNotFinalized)?;
    require!(tier_winner == winner, OpenBountyError::NotWinner);
    require!(!tier.claimed, OpenBountyError::PrizeAlreadyClaimed);
    // A winner's prize is theirs until the claim window ends (Q3 revised).
    // A refunded winner tier implies the window has closed.
    require!(
        now <= claim_deadline && !tier.refunded,
        OpenBountyError::ClaimWindowClosed
    );

    tier.claimed = true;
    let amount = tier.amount;

    pay_from_vault(
        &ctx.accounts.escrow,
        &ctx.accounts.vault,
        ctx.accounts.winner.to_account_info(),
        &ctx.accounts.system_program,
        amount,
    )?;
    emit!(PrizeClaimed {
        escrow: escrow_key,
        tier_index,
        winner,
        amount,
    });

    close_if_settled(
        &mut ctx.accounts.escrow,
        &ctx.accounts.vault,
        ctx.accounts.organizer.to_account_info(),
        &ctx.accounts.system_program,
    )
}
