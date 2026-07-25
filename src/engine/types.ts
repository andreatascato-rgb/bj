/** Card rank for strategy: Ace=1, face=10, else pip value */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type DealerUp = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 1;

/** Raw chart codes before rule fallbacks */
export type ChartCode =
  | "H"
  | "S"
  | "Dh"
  | "Ds"
  | "P"
  | "Ph"
  | "Rh"
  | "Rs"
  | "Rp";

export type Action =
  | "hit"
  | "stand"
  | "double"
  | "split"
  | "surrender"
  | "insurance_no"
  | "insurance_yes";

export type HoleCardRule = "enhc" | "peek" | "obo";

export type Soft17 = "S17" | "H17";

export type DoubleRule = "any" | "nineToEleven";

export interface TableRules {
  decks: 1 | 2 | 6;
  soft17: Soft17;
  holeCard: HoleCardRule;
  double: DoubleRule;
  das: boolean;
  surrender: boolean;
  resplitAces: boolean;
}

export interface HandValue {
  total: number;
  soft: boolean;
  isPair: boolean;
  pairRank: Rank | null;
  isBlackjack: boolean;
  busted: boolean;
}

export interface Advice {
  action: Action;
  label: string;
  reason: string;
  chartCode: ChartCode;
  handKind: "hard" | "soft" | "pair";
  playerKey: string;
  dealerUp: DealerUp;
  /** When chart wanted double/surrender but rules forbade it */
  fallbackNote?: string;
}

export const DEFAULT_RULES: TableRules = {
  decks: 6,
  soft17: "S17",
  holeCard: "enhc",
  double: "nineToEleven",
  das: true,
  surrender: false,
  resplitAces: false,
};

export const PRESETS = {
  italia: {
    id: "italia",
    name: "Casinò italiano / EU",
    description: "ENHC, shoe, raddoppio 9–11, tipico Europa",
    rules: DEFAULT_RULES,
  },
  usa: {
    id: "usa",
    name: "USA peek classico",
    description: "Banco controlla BJ, raddoppio su qualsiasi due carte",
    rules: {
      decks: 6 as const,
      soft17: "S17" as const,
      holeCard: "peek" as const,
      double: "any" as const,
      das: true,
      surrender: false,
      resplitAces: false,
    },
  },
} as const;
