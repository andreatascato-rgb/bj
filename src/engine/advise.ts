import { evaluateHand } from "./hand";
import {
  DEALER_COLS,
  DRILL_CELL_TOTAL,
  ENHC_OVERRIDES,
  H17_OVERRIDES,
  HARD_PEEK,
  PAIR_PEEK,
  SOFT_PEEK,
  dealerIndex,
  pairKey,
} from "@/data/strategy/charts";
import type {
  Action,
  Advice,
  ChartCode,
  DealerUp,
  Rank,
  TableRules,
} from "./types";

export const ACTION_LABELS: Record<Action, string> = {
  hit: "Carta",
  stand: "Stai",
  double: "Raddoppia",
  split: "Dividi",
  surrender: "Resa",
  insurance_no: "No assicurazione",
  insurance_yes: "Assicurazione",
};

function canDouble(rules: TableRules, total: number, cards: Rank[]): boolean {
  if (cards.length !== 2) return false;
  if (rules.double === "any") return true;
  const v = evaluateHand(cards);
  return !v.soft && total >= 9 && total <= 11;
}

function resolveCode(
  code: ChartCode,
  rules: TableRules,
  cards: Rank[],
  total: number,
): { action: Action; fallbackNote?: string } {
  switch (code) {
    case "H":
      return { action: "hit" };
    case "S":
      return { action: "stand" };
    case "Dh": {
      if (canDouble(rules, total, cards)) return { action: "double" };
      return {
        action: "hit",
        fallbackNote: "Raddoppio non disponibile con le tue regole → Carta",
      };
    }
    case "Ds": {
      if (canDouble(rules, total, cards)) return { action: "double" };
      return {
        action: "stand",
        fallbackNote: "Raddoppio non disponibile con le tue regole → Stai",
      };
    }
    case "P":
      return { action: "split" };
    case "Ph":
      return rules.das
        ? { action: "split" }
        : {
            action: "hit",
            fallbackNote: "Senza DAS lo split non conviene → Carta",
          };
    case "Rh":
      return rules.surrender && cards.length === 2
        ? { action: "surrender" }
        : { action: "hit" };
    case "Rs":
      return rules.surrender && cards.length === 2
        ? { action: "surrender" }
        : { action: "stand" };
    case "Rp":
      return rules.surrender && cards.length === 2
        ? { action: "surrender" }
        : { action: "split" };
    default:
      return { action: "hit" };
  }
}

function lookupBase(
  cards: Rank[],
  dealerUp: DealerUp,
): { code: ChartCode; kind: Advice["handKind"]; playerKey: string } {
  const v = evaluateHand(cards);
  const di = dealerIndex(dealerUp);

  if (v.isPair && cards.length === 2 && v.pairRank !== null) {
    const pk = pairKey(v.pairRank);
    const row = PAIR_PEEK[pk];
    return {
      code: row[di],
      kind: "pair",
      playerKey: pk === 1 ? "A" : String(pk),
    };
  }

  if (v.soft && v.total < 21) {
    const row = SOFT_PEEK[v.total] ?? SOFT_PEEK[20];
    return { code: row[di], kind: "soft", playerKey: String(v.total) };
  }

  const hardTotal = Math.min(21, Math.max(5, v.total));
  const row = HARD_PEEK[hardTotal] ?? HARD_PEEK[17];
  return { code: row[di], kind: "hard", playerKey: String(hardTotal) };
}

function overrideKey(
  kind: Advice["handKind"],
  playerKey: string,
  dealerUp: DealerUp,
): string {
  if (kind === "pair") {
    const pk = playerKey === "A" ? "1" : playerKey;
    return `pair:${pk}:${dealerUp}`;
  }
  return `${kind}:${playerKey}:${dealerUp}`;
}

/** H17 first, then ENHC (ENHC must win on no-extra-money spots). OBO == peek. */
function applyRuleOverlays(
  kind: Advice["handKind"],
  playerKey: string,
  dealerUp: DealerUp,
  code: ChartCode,
  rules: TableRules,
): ChartCode {
  let next = code;
  const key = overrideKey(kind, playerKey, dealerUp);
  if (rules.soft17 === "H17") {
    next = H17_OVERRIDES[key] ?? next;
  }
  if (rules.holeCard === "enhc") {
    next = ENHC_OVERRIDES[key] ?? next;
  }
  return next;
}

function reasonFor(
  action: Action,
  kind: Advice["handKind"],
  totalLabel: string,
  dealerUp: DealerUp,
  rules: TableRules,
): string {
  const d = dealerUp === 1 ? "A" : String(dealerUp);
  if (action === "surrender") {
    return `${totalLabel} vs ${d}: resa — perdi metà; è meglio che giocare la mano.`;
  }
  if (action === "split") {
    return `${totalLabel} vs ${d}: dividi — due mani separate valgono di più.`;
  }
  if (action === "double") {
    return `${totalLabel} vs ${d}: raddoppia — il vantaggio giustifica più fiches.`;
  }
  if (action === "stand") {
    if (dealerUp >= 2 && dealerUp <= 6) {
      return `${totalLabel} vs ${d}: stai — banco debole, rischia di sballare.`;
    }
    return `${totalLabel} vs ${d}: stai — non migliorare battendo il banco da qui.`;
  }
  if (rules.holeCard === "enhc" && (dealerUp === 1 || dealerUp === 10)) {
    return `${totalLabel} vs ${d}: carta — con ENHC non mettere soldi extra contro 10/A.`;
  }
  if (kind === "soft") {
    return `${totalLabel} vs ${d}: carta — con l'asso puoi ancora migliorare.`;
  }
  return `${totalLabel} vs ${d}: carta — stare qui perde troppo spesso.`;
}

function describeHand(cards: Rank[]): string {
  const v = evaluateHand(cards);
  if (v.isPair && cards.length === 2 && v.pairRank !== null) {
    const r = v.pairRank === 1 ? "A" : String(v.pairRank);
    return `Coppia di ${r}`;
  }
  if (v.soft) return `Soft ${v.total}`;
  return `Hard ${v.total}`;
}

export function getAdvice(
  cards: Rank[],
  dealerUp: DealerUp,
  rules: TableRules,
): Advice | null {
  if (cards.length < 2) return null;
  const v = evaluateHand(cards);
  if (v.busted) {
    return {
      action: "stand",
      label: "Sballato",
      reason: "Hai superato 21.",
      chartCode: "S",
      handKind: "hard",
      playerKey: String(v.total),
      dealerUp,
    };
  }
  if (v.isBlackjack) {
    return {
      action: "stand",
      label: "Blackjack",
      reason: "Blackjack naturale — aspetta il banco.",
      chartCode: "S",
      handKind: "hard",
      playerKey: "21",
      dealerUp,
    };
  }

  const base = lookupBase(cards, dealerUp);
  const code = applyRuleOverlays(
    base.kind,
    base.playerKey,
    dealerUp,
    base.code,
    rules,
  );
  const resolved = resolveCode(code, rules, cards, v.total);

  return {
    action: resolved.action,
    label: ACTION_LABELS[resolved.action],
    reason: reasonFor(
      resolved.action,
      base.kind,
      describeHand(cards),
      dealerUp,
      rules,
    ),
    chartCode: code,
    handKind: base.kind,
    playerKey: base.playerKey,
    dealerUp,
    fallbackNote: resolved.fallbackNote,
  };
}

export function getInsuranceAdvice(dealerUp: DealerUp): Advice {
  return {
    action: "insurance_no",
    label: ACTION_LABELS.insurance_no,
    reason:
      dealerUp === 1
        ? "Basic strategy: rifiuta sempre l'assicurazione (senza card counting)."
        : "L'assicurazione si offre solo con Asso del banco.",
    chartCode: "H",
    handKind: "hard",
    playerKey: "ins",
    dealerUp,
  };
}

export function rulesLabel(rules: TableRules): string {
  const hole =
    rules.holeCard === "enhc"
      ? "ENHC"
      : rules.holeCard === "peek"
        ? "Peek"
        : "OBO";
  const dbl = rules.double === "any" ? "D any" : "D 9–11";
  return `${hole} · ${rules.soft17} · ${dbl}${rules.das ? " · DAS" : ""}${
    rules.surrender ? " · Resa" : ""
  }`;
}

export function synthesizeHard(total: number): Rank[] {
  if (total === 5) return [2, 3];
  if (total === 6) return [2, 4];
  if (total === 7) return [3, 4];
  if (total === 8) return [3, 5];
  if (total === 9) return [4, 5];
  if (total === 10) return [4, 6];
  if (total === 11) return [5, 6];
  if (total >= 12 && total <= 20) return [10, (total - 10) as Rank];
  if (total === 21) return [10, 9, 2];
  return [2, 3];
}

export function synthesizeSoft(total: number): Rank[] {
  return [1, (total - 11) as Rank];
}

export function cellId(
  kind: Advice["handKind"],
  playerKey: string,
  dealerUp: DealerUp,
): string {
  return `${kind}:${playerKey}:${dealerUp}`;
}

export function allDrillCells(filter?: Advice["handKind"]): {
  id: string;
  kind: Advice["handKind"];
  playerKey: string;
  dealerUp: DealerUp;
  cards: Rank[];
}[] {
  const cells: {
    id: string;
    kind: Advice["handKind"];
    playerKey: string;
    dealerUp: DealerUp;
    cards: Rank[];
  }[] = [];

  for (const d of DEALER_COLS) {
    for (let t = 8; t <= 17; t++) {
      cells.push({
        id: cellId("hard", String(t), d),
        kind: "hard",
        playerKey: String(t),
        dealerUp: d,
        cards: synthesizeHard(t),
      });
    }
    for (let t = 13; t <= 20; t++) {
      cells.push({
        id: cellId("soft", String(t), d),
        kind: "soft",
        playerKey: String(t),
        dealerUp: d,
        cards: synthesizeSoft(t),
      });
    }
    for (const r of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as Rank[]) {
      const pk = r === 1 ? "A" : String(r);
      cells.push({
        id: cellId("pair", pk, d),
        kind: "pair",
        playerKey: pk,
        dealerUp: d,
        cards: [r, r],
      });
    }
  }
  return filter ? cells.filter((c) => c.kind === filter) : cells;
}

export { DEALER_COLS, DRILL_CELL_TOTAL };
