use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

use crate::{
    constants::*,
    error::OpenBountyError,
    events::EscrowInitialized,
    state::{Escrow, PrizeTier},
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct InitializeEscrowParams {
    pub nonce: u8,
    pub title: String,
    pub metadata_uri: String,
    pub judges: Vec<Pubkey>,
    pub vote_threshold: u8,
    /// One entry per prize tier, in lamports. The vault is funded with their
    /// sum in this same instruction.
    pub prize_amounts: Vec<u64>,
    /// Unix timestamp (seconds): entries close. At most `deadline`.
    pub submissions_deadline: i64,
    /// Unix timestamp (seconds): voting closes.
    pub deadline: i64,
    /// Seconds after `deadline` during which winners can still claim.
    pub claim_window: i64,
}

#[derive(Accounts)]
#[instruction(params: InitializeEscrowParams)]
pub struct InitializeEscrow<'info> {
    /// Creates the escrow and funds the complete prize pool.
    #[account(mut)]
    pub organizer: Signer<'info>,

    #[account(
        init,
        payer = organizer,
        space = Escrow::SPACE,
        seeds = [ESCROW_SEED, organizer.key().as_ref(), params.nonce.to_le_bytes().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,

    /// Program-controlled, data-less system account holding the prize pool.
    #[account(
        mut,
        seeds = [VAULT_SEED, organizer.key().as_ref(), params.nonce.to_le_bytes().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_escrow(
    ctx: Context<InitializeEscrow>,
    params: InitializeEscrowParams,
) -> Result<()> {
    let organizer = ctx.accounts.organizer.key();
    let now = Clock::get()?.unix_timestamp;

    // --- Validate the configuration -----------------------------------------
    require!(
        !params.title.is_empty() && params.title.len() <= MAX_TITLE_LENGTH,
        OpenBountyError::InvalidTitle
    );
    require!(
        params.metadata_uri.len() <= MAX_METADATA_URI_LENGTH,
        OpenBountyError::InvalidMetadataUri
    );

    let judge_count = params.judges.len();
    require!(
        (1..=MAX_JUDGES).contains(&judge_count),
        OpenBountyError::InvalidJudgeCount
    );
    for (i, judge) in params.judges.iter().enumerate() {
        require!(
            !params.judges[..i].contains(judge),
            OpenBountyError::DuplicateJudge
        );
        require!(*judge != organizer, OpenBountyError::OrganizerCannotBeJudge);
    }

    // A strict majority (Q6): two disjoint groups can never both reach it.
    let threshold = params.vote_threshold as usize;
    require!(
        threshold <= judge_count && threshold * 2 > judge_count,
        OpenBountyError::InvalidVoteThreshold
    );

    require!(
        (1..=MAX_PRIZE_TIERS).contains(&params.prize_amounts.len()),
        OpenBountyError::InvalidPrizeTierCount
    );
    let min_prize = MIN_PRIZE_AMOUNT.max(Rent::get()?.minimum_balance(0));
    let mut prize_pool: u64 = 0;
    for amount in &params.prize_amounts {
        require!(*amount >= min_prize, OpenBountyError::InvalidPrizeAmount);
        prize_pool = prize_pool
            .checked_add(*amount)
            .ok_or(OpenBountyError::PrizePoolOverflow)?;
    }

    // Q14: now < deadline <= now + 365 days.
    let latest_deadline = now
        .checked_add(MAX_DEADLINE_AHEAD)
        .ok_or(OpenBountyError::ArithmeticOverflow)?;
    require!(
        params.deadline > now && params.deadline <= latest_deadline,
        OpenBountyError::InvalidDeadline
    );
    require!(
        params.submissions_deadline > now && params.submissions_deadline <= params.deadline,
        OpenBountyError::InvalidSubmissionsDeadline
    );
    require!(
        (MIN_CLAIM_WINDOW..=MAX_CLAIM_WINDOW).contains(&params.claim_window),
        OpenBountyError::InvalidClaimWindow
    );
    let claim_deadline = params
        .deadline
        .checked_add(params.claim_window)
        .ok_or(OpenBountyError::ArithmeticOverflow)?;

    // --- Save the escrow -----------------------------------------------------
    let escrow = &mut ctx.accounts.escrow;
    escrow.organizer = organizer;
    escrow.nonce = params.nonce;
    escrow.bump = ctx.bumps.escrow;
    escrow.vault_bump = ctx.bumps.vault;
    escrow.vote_threshold = params.vote_threshold;
    escrow.created_at = now;
    escrow.submissions_deadline = params.submissions_deadline;
    escrow.deadline = params.deadline;
    escrow.claim_deadline = claim_deadline;
    escrow.title = params.title;
    escrow.metadata_uri = params.metadata_uri;
    escrow.judges = params.judges;
    escrow.prize_tiers = params
        .prize_amounts
        .iter()
        .map(|&amount| PrizeTier {
            amount,
            winner: None,
            claimed: false,
            refunded: false,
            votes: Vec::new(),
        })
        .collect();

    // --- Fund the vault with the whole prize pool, atomically ---------------
    // Lamports someone sent to the vault address earlier are tolerated (so a
    // nonce can't be blocked by pre-funding it): payouts use tier amounts,
    // and the remainder goes back to the organizer when the escrow closes.
    let vault_before = ctx.accounts.vault.lamports();
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.key(),
            Transfer {
                from: ctx.accounts.organizer.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        prize_pool,
    )?;
    let vault_after = ctx.accounts.vault.lamports();
    require!(
        vault_after.checked_sub(vault_before) == Some(prize_pool),
        OpenBountyError::IncorrectFunding
    );

    emit!(EscrowInitialized {
        escrow: ctx.accounts.escrow.key(),
        organizer,
        nonce: params.nonce,
        prize_pool,
        submissions_deadline: params.submissions_deadline,
        deadline: params.deadline,
        claim_deadline,
    });
    Ok(())
}
