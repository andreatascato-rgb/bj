import type { ChartCode, DealerUp, Rank } from "@/engine/types";

/** Dealer upcard column order */
export const DEALER_COLS: DealerUp[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 1];

export function dealerIndex(up: DealerUp): number {
  return DEALER_COLS.indexOf(up);
}

/**
 * Multi-deck S17 DAS peek (American) base chart — Wizard-of-Odds class.
 * Hard totals 5–21, Soft A2–A9 (13–20), Pairs A–T.
 * Codes: H S Dh Ds P Ph Rh Rs Rp
 */
export const HARD_PEEK: Record<number, ChartCode[]> = {
  5: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  6: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  7: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  8: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  9: ["H", "Dh", "Dh", "Dh", "Dh", "H", "H", "H", "H", "H"],
  10: ["Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "H", "H"],
  11: ["Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "H"],
  12: ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"],
  13: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  14: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  15: ["S", "S", "S", "S", "S", "H", "H", "H", "Rh", "H"],
  16: ["S", "S", "S", "S", "S", "H", "H", "Rh", "Rh", "Rh"],
  17: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  18: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  19: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  20: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  21: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
};

/** Soft totals keyed by total (13–20) */
export const SOFT_PEEK: Record<number, ChartCode[]> = {
  13: ["H", "H", "H", "Dh", "Dh", "H", "H", "H", "H", "H"],
  14: ["H", "H", "H", "Dh", "Dh", "H", "H", "H", "H", "H"],
  15: ["H", "H", "Dh", "Dh", "Dh", "H", "H", "H", "H", "H"],
  16: ["H", "H", "Dh", "Dh", "Dh", "H", "H", "H", "H", "H"],
  17: ["H", "Dh", "Dh", "Dh", "Dh", "H", "H", "H", "H", "H"],
  18: ["Ds", "Ds", "Ds", "Ds", "Ds", "S", "S", "H", "H", "H"],
  19: ["S", "S", "S", "S", "Ds", "S", "S", "S", "S", "S"],
  20: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
};

/** Pair rank: 1=A, 2–9, 10=T */
export const PAIR_PEEK: Record<number, ChartCode[]> = {
  1: ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
  2: ["Ph", "Ph", "P", "P", "P", "P", "H", "H", "H", "H"],
  3: ["Ph", "Ph", "P", "P", "P", "P", "H", "H", "H", "H"],
  4: ["H", "H", "H", "Ph", "Ph", "H", "H", "H", "H", "H"],
  5: ["Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "Dh", "H", "H"],
  6: ["Ph", "P", "P", "P", "P", "H", "H", "H", "H", "H"],
  7: ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"],
  8: ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
  9: ["P", "P", "P", "P", "P", "S", "P", "P", "S", "S"],
  10: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
};

/**
 * ENHC overlays on peek chart (multi-deck S17).
 * Key: `${kind}:${playerKey}:${dealer}` e.g. hard:11:10, pair:8:1
 */
export const ENHC_OVERRIDES: Record<string, ChartCode> = {
  "hard:11:10": "H",
  "hard:11:1": "H",
  "hard:10:1": "H",
  "pair:8:1": "H",
  "pair:1:1": "H",
};

/** Multi-deck H17 deltas vs S17 base (applied before ENHC). */
export const H17_OVERRIDES: Record<string, ChartCode> = {
  "hard:11:1": "Dh",
  "soft:19:4": "Ds",
  "soft:19:5": "Ds",
  "hard:17:1": "Rs",
};

/** Drill grid size: hard 8–17 + soft 13–20 + pairs A–10, × 10 dealer upcards */
export const DRILL_CELL_TOTAL = 280;

export function pairKey(rank: Rank): number {
  return rank === 1 ? 1 : rank >= 10 ? 10 : rank;
}
