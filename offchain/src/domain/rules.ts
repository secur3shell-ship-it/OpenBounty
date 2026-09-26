// Protocol limits and rules, mirrored from the program so the app can show
// friendly messages before anything is signed. The program itself enforces
// them. Keep this in sync with programs/openbounty_v2/src/constants.rs and the
// owner's decisions (doc/project_context.md §9.3).

// Size limits from constants.rs. They aren't in the IDL, so they're copied here.
export const MAX_JUDGES = 5;
export const MAX_PRIZE_TIERS = 4;
export const MAX_TITLE_BYTES = 50;
export const MAX_METADATA_URI_BYTES = 100;

/** Q14: the deadline can be at most one year after "now" (network time). */
export const MAX_DEADLINE_AHEAD_SECONDS = 365n * 24n * 60n * 60n;

/** Extra room so a create transaction can't land after its own deadline check. */
export const DEADLINE_SAFETY_MARGIN_SECONDS = 10n * 60n;

/** The prize total has to fit in a u64 on-chain. */
export const U64_MAX = 2n ** 64n - 1n;

/** The system program's address (all zeros). Never a valid candidate (Q5). */
export const SYSTEM_PROGRAM_ADDRESS = '11111111111111111111111111111111';
