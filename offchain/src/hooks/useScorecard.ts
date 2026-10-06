"use client";

// A judge's private scorecard for one bounty: read from and saved to this browser.

import { useState } from "react";
import type { Address } from "@solana/kit";
import { Score, Scorecard, loadScorecard, saveScorecard } from "@/utils/scorecard";

export function useScorecard(bounty: string | null, judge: Address | null) {
  // One scorecard per bounty and judge wallet
  const scorecardId = bounty && judge ? `${bounty}:${judge}` : null;

  // The last scorecard saved in this session. If it belongs to another bounty or
  // judge, read the right one from storage instead (no effect needed).
  const [saved, setSaved] = useState<{ id: string | null; card: Scorecard }>({ id: null, card: {} });
  let scorecard: Scorecard = {};
  if (scorecardId && saved.id === scorecardId) scorecard = saved.card;
  else if (scorecardId) scorecard = loadScorecard(scorecardId);

  function saveScore(submissionId: string, score: Score) {
    if (!scorecardId) return;
    const next = { ...scorecard, [submissionId]: score };
    saveScorecard(scorecardId, next);
    setSaved({ id: scorecardId, card: next });
  }

  return { scorecard, saveScore };
}
