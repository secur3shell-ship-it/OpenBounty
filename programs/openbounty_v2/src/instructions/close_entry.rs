use anchor_lang::prelude::*;

use crate::{constants::*, error::OpenBountyError, events::EntryClosed, state::Submission};

#[derive(Accounts)]
pub struct CloseEntry<'info> {
    /// Gets the entry's rent back.
    #[account(mut)]
    pub submitter: Signer<'info>,

    /// Doesn't need the escrow: it may already be closed.
    #[account(
        mut,
        seeds = [
            SUBMISSION_SEED,
            submission.escrow.as_ref(),
            submission.escrow_created_at.to_le_bytes().as_ref(),
            submitter.key().as_ref(),
        ],
        bump = submission.bump,
        has_one = submitter,
        close = submitter,
    )]
    pub submission: Account<'info, Submission>,
}

/// Entries stay visible to judges until voting ends; only then can the
/// builder take the rent back.
pub fn handle_close_entry(ctx: Context<CloseEntry>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let submission = &ctx.accounts.submission;
    require!(now > submission.close_after, OpenBountyError::EntryLocked);

    emit!(EntryClosed {
        escrow: submission.escrow,
        submission: submission.key(),
        submitter: submission.submitter,
    });
    Ok(())
}
