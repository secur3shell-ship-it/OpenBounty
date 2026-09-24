use anchor_lang::prelude::*;

use crate::{constants::*, error::OpenBountyError, state::Escrow};

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
    _ctx: Context<VoteWinner>,
    _tier_index: u8,
    _candidate: Pubkey,
) -> Result<()> {
    // TODO(vote_winner): implement.
    //  - Reject the organizer (OrganizerCannotVote) and non-judges
    //    (UnauthorizedJudge).
    //  - Check tier_index (InvalidTier) and that the tier has no winner yet
    //    (TierAlreadyFinalized).
    //  - Validate the candidate (InvalidCandidate). At minimum reject the
    //    organizer: claim_prize takes both winner and organizer as writable
    //    accounts, and Anchor rejects duplicate mutable accounts.
    //  - Enforce the duplicate-vote rule (DuplicateVote), record the vote,
    //    and set `winner` once a candidate reaches vote_threshold.
    //  - Open protocol questions: can votes be changed, can votes land after
    //    the deadline, can one candidate win several tiers?
    err!(OpenBountyError::NotImplemented)
}
