// Judge scorecards: private 1-5 ratings per entry, saved only in this browser
// (localStorage), never on-chain. Only the final vote is public.

export type CriterionKey = "innovation" | "execution" | "impact";

export interface Criterion {
  key: CriterionKey;
  label: string;
  hint: string;
}

export const CRITERIA: Criterion[] = [
  { key: "innovation", label: "Innovation", hint: "How new or clever is the idea?" },
  { key: "execution",  label: "Execution",  hint: "How well is it built and polished?" },
  { key: "impact",     label: "Impact",     hint: "How useful is it for the ecosystem?" },
];

export const MAX_RATING = 5;
export const MAX_TOTAL = CRITERIA.length * MAX_RATING;

// 0 means "not rated yet"
export interface Score {
  innovation: number;
  execution: number;
  impact: number;
  note: string;
}

// Scores for one bounty by one judge, keyed by entry id
export type Scorecard = Record<string, Score>;

export function emptyScore(): Score {
  return { innovation: 0, execution: 0, impact: 0, note: "" };
}

// Sum of the ratings, or null until every criterion is rated
export function scoreTotal(score: Score | undefined): number | null {
  if (!score) return null;
  const ratings = CRITERIA.map((criterion) => score[criterion.key]);
  if (ratings.some((rating) => rating === 0)) return null;
  return ratings.reduce((sum, rating) => sum + rating, 0);
}

// Storage can be blocked (private windows, strict settings), so every access is guarded
// and a failure just means "no saved scores".
function storageKey(scorecardId: string): string {
  return `openbounty:scorecard:${scorecardId}`;
}

export function loadScorecard(scorecardId: string): Scorecard {
  try {
    const raw = window.localStorage.getItem(storageKey(scorecardId));
    return raw ? (JSON.parse(raw) as Scorecard) : {};
  } catch {
    return {};
  }
}

export function saveScorecard(scorecardId: string, scorecard: Scorecard): void {
  try {
    window.localStorage.setItem(storageKey(scorecardId), JSON.stringify(scorecard));
  } catch {
    // Not saved; scores still work for this visit
  }
}
