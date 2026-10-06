use anchor_lang::prelude::*;

use crate::constants::*;

/// A builder's entry to a bounty. PDA:
/// `["submission", escrow, escrow.created_at (i64 LE), submitter]`, so each wallet
/// enters a bounty at most once.
///
/// `created_at` is in the seeds because an escrow address can be reused: once a
/// bounty settles and closes, its organizer may create a new one with the same
/// nonce. Entries left from the old bounty must not block or appear in the new one.
///
/// Votes still name wallets, not entries: an entry lets judges see what a
/// candidate built, but it is not required to be voted for.
///
/// Layout: `escrow` (offset 8) and `escrow_created_at` (offset 40) come first, so
/// clients list one bounty's entries with two `getProgramAccounts` memcmp filters.
#[account]
#[derive(InitSpace)]
pub struct Submission {
    pub escrow: Pubkey,
    /// `created_at` of the escrow this entry belongs to (see above).
    pub escrow_created_at: i64,
    /// Pays the rent and gets it back through `close_entry`.
    pub submitter: Pubkey,
    pub submitted_at: i64,
    /// The bounty's voting deadline, copied at submission so the entry can be
    /// closed even after the escrow account itself has closed.
    pub close_after: i64,
    pub bump: u8,
    #[max_len(MAX_ENTRY_TITLE_LENGTH)]
    pub title: String,
    #[max_len(MAX_ENTRY_URL_LENGTH)]
    pub url: String,
    #[max_len(MAX_ENTRY_DESCRIPTION_LENGTH)]
    pub description: String,
}

impl Submission {
    /// Full account size, including the 8-byte discriminator.
    pub const SPACE: usize = Submission::DISCRIMINATOR.len() + Submission::INIT_SPACE;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn worst_case_submission_serializes_within_space() {
        let submission = Submission {
            escrow: Pubkey::new_unique(),
            escrow_created_at: i64::MAX,
            submitter: Pubkey::new_unique(),
            submitted_at: i64::MAX,
            close_after: i64::MAX,
            bump: u8::MAX,
            title: "t".repeat(MAX_ENTRY_TITLE_LENGTH),
            url: "u".repeat(MAX_ENTRY_URL_LENGTH),
            description: "d".repeat(MAX_ENTRY_DESCRIPTION_LENGTH),
        };

        let mut bytes = Vec::new();
        submission.serialize(&mut bytes).unwrap();
        assert_eq!(bytes.len(), Submission::INIT_SPACE);
    }
}
