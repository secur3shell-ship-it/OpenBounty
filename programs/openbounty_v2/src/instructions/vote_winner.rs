use anchor_lang::prelude::*;

use crate::{
    constants::*,
    error::OpenBountyError,
    events::{TierFinalized, VoteCast},
    state::{Escrow, Vote},
};

#[derive(Accounts)]
pub struct VoteWinner<'info> {
    /// Must be one of `escrow.judges`. Each judge signs their own vote.
    pub judge: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.organizer.as_ref(), escrow.nonce.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
}

pub fn handle_vote_winner(
    ctx: Context<VoteWinner>,
    tier_index: u8,
    candidate: Pubkey,
) -> Result<()> {
    let judge = ctx.accounts.judge.key();
    let escrow_key = ctx.accounts.escrow.key();
    let escrow = &mut ctx.accounts.escrow;
    let now = Clock::get()?.unix_timestamp;

    require!(judge != escrow.organizer, OpenBountyError::OrganizerCannotVote);
    require!(escrow.is_judge(&judge), OpenBountyError::UnauthorizedJudge);
    // Q2: voting closes at the deadline.
    require!(now <= escrow.deadline, OpenBountyError::VotingClosed);

    // Q5: never the organizer, a judge, the all-zero key or this bounty's own
    // PDAs. Rejecting the organizer also keeps claim_prize free of duplicate
    // writable accounts (winner and organizer).
    let vault = Pubkey::create_program_address(
        &[
            VAULT_SEED,
            escrow.organizer.as_ref(),
            &[escrow.nonce],
            &[escrow.vault_bump],
        ],
        &crate::ID,
    )
    .map_err(|_| OpenBountyError::InvalidCandidate)?;
    require!(
        candidate != escrow.organizer
            && !escrow.is_judge(&candidate)
            && candidate != Pubkey::default()
            && candidate != escrow_key
            && candidate != vault,
        OpenBountyError::InvalidCandidate
    );

    let threshold = escrow.vote_threshold as usize;
    let tier = escrow
        .prize_tiers
        .get_mut(tier_index as usize)
        .ok_or(OpenBountyError::InvalidTier)?;
    require!(tier.winner.is_none(), OpenBountyError::TierAlreadyFinalized);
    // Q1: votes are final, one per judge per tier.
    require!(
        !tier.votes.iter().any(|vote| vote.judge == judge),
        OpenBountyError::DuplicateVote
    );

    tier.votes.push(Vote { judge, candidate });
    emit!(VoteCast {
        escrow: escrow_key,
        tier_index,
        judge,
        candidate,
    });

    let candidate_votes = tier.votes.iter().filter(|v| v.candidate == candidate).count();
    if candidate_votes >= threshold {
        tier.winner = Some(candidate);
        emit!(TierFinalized {
            escrow: escrow_key,
            tier_index,
            winner: candidate,
        });
    }
    Ok(())
}
