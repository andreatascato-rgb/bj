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
    name: "Casinò italiano / EU tipico",
    description: "ENHC, shoe, raddoppio solo 9–11 — profilo Europa generico",
    rules: DEFAULT_RULES,
  },
  saintVincent: {
    id: "saintVincent",
    name: "Casinò de la Vallée · Saint-Vincent",
    description:
      "ENHC · banco sta su 17 · raddoppio su qualsiasi totale · DAS tipico (verifica al tavolo)",
    rules: {
      decks: 6 as const,
      soft17: "S17" as const,
      holeCard: "enhc" as const,
      double: "any" as const,
      das: true,
      surrender: false,
      resplitAces: false,
    },
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

export type PresetId = keyof typeof PRESETS;

export const PRESET_ORDER: PresetId[] = ["saintVincent", "italia", "usa"];

export function matchesPreset(rules: TableRules, id: PresetId): boolean {
  const p = PRESETS[id].rules;
  return (
    rules.decks === p.decks &&
    rules.soft17 === p.soft17 &&
    rules.holeCard === p.holeCard &&
    rules.double === p.double &&
    rules.das === p.das &&
    rules.surrender === p.surrender &&
    rules.resplitAces === p.resplitAces
  );
}

/** First matching named preset, or null if custom. */
export function findMatchingPreset(rules: TableRules): PresetId | null {
  for (const id of PRESET_ORDER) {
    if (matchesPreset(rules, id)) return id;
  }
  return null;
}
