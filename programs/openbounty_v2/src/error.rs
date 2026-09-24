use anchor_lang::prelude::*;

/// Every expected protocol violation maps to one of these errors. Handlers
/// must fail with a specific variant, never with a panic.
///
/// Variants are append-only once deployed: error codes are part of the IDL,
/// and clients match on them.
#[error_code]
pub enum OpenBountyError {
    // --- Configuration (initialize_escrow) ---------------------------------
    #[msg("Title is empty or exceeds the maximum length")]
    InvalidTitle,
    #[msg("Metadata URI exceeds the maximum length")]
    InvalidMetadataUri,
    #[msg("Judge list is empty or exceeds the maximum number of judges")]
    InvalidJudgeCount,
    #[msg("Judge list contains a duplicate judge")]
    DuplicateJudge,
    #[msg("The organizer cannot be a judge")]
    OrganizerCannotBeJudge,
    #[msg("Vote threshold must be between 1 and the number of judges")]
    InvalidVoteThreshold,
    #[msg("Prize tier list is empty or exceeds the maximum number of tiers")]
    InvalidPrizeTierCount,
    #[msg("Prize tier amount must be greater than zero")]
    InvalidPrizeAmount,
    #[msg("Total prize pool overflows")]
    PrizePoolOverflow,
    #[msg("Deadline must be in the future")]
    InvalidDeadline,
    #[msg("Vault was not funded with the exact prize pool")]
    IncorrectFunding,

    // --- Authorization ------------------------------------------------------
    #[msg("Signer is not the organizer of this escrow")]
    UnauthorizedOrganizer,
    #[msg("Signer is not a judge of this escrow")]
    UnauthorizedJudge,
    #[msg("The organizer cannot vote")]
    OrganizerCannotVote,
    #[msg("Signer is not the winner of this prize tier")]
    NotWinner,

    // --- Voting (vote_winner) -----------------------------------------------
    #[msg("Prize tier index is out of range")]
    InvalidTier,
    #[msg("Candidate is not eligible to win")]
    InvalidCandidate,
    #[msg("Judge has already voted on this prize tier")]
    DuplicateVote,
    #[msg("Prize tier already has a finalized winner")]
    TierAlreadyFinalized,

    // --- Claims (claim_prize) -----------------------------------------------
    #[msg("Prize tier has no finalized winner")]
    TierNotFinalized,
    #[msg("Prize has already been claimed")]
    PrizeAlreadyClaimed,

    // --- Refunds (refund_unclaimed) -----------------------------------------
    #[msg("Deadline has not been reached")]
    DeadlineNotReached,
    #[msg("Prize tier is not eligible for refund")]
    RefundNotEligible,

    // --- Account relationships ---------------------------------------------
    #[msg("Organizer account does not match the escrow organizer")]
    OrganizerMismatch,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    // --- Scaffold -----------------------------------------------------------
    // Kept last so removing it does not renumber the protocol errors above.
    #[msg("Instruction is not implemented yet")]
    NotImplemented,
}
