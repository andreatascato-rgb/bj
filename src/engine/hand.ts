import type { HandValue, Rank } from "./types";

export function evaluateHand(cards: Rank[]): HandValue {
  if (cards.length === 0) {
    return {
      total: 0,
      soft: false,
      isPair: false,
      pairRank: null,
      isBlackjack: false,
      busted: false,
    };
  }

  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c === 1) {
      aces += 1;
      total += 11;
    } else {
      total += c;
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  const soft = aces > 0 && total <= 21;
  const isPair =
    cards.length === 2 &&
    (cards[0] === cards[1] || (cards[0] >= 10 && cards[1] >= 10));
  // Face cards are all 10 — pair of tens if both are 10-value
  const pairRank: Rank | null = isPair
    ? cards[0] === 1
      ? 1
      : cards[0] >= 10
        ? 10
        : cards[0]
    : null;

  const isBlackjack = cards.length === 2 && total === 21;
  const busted = total > 21;

  return { total, soft, isPair, pairRank, isBlackjack, busted };
}

export function dealerLabel(up: Rank): string {
  return up === 1 ? "A" : String(up);
}

export function handLabel(cards: Rank[]): string {
  const v = evaluateHand(cards);
  if (v.isPair && cards.length === 2) {
    const r = v.pairRank === 1 ? "A" : String(v.pairRank);
    return `Coppia di ${r}`;
  }
  if (v.soft) return `Soft ${v.total}`;
  return `Hard ${v.total}`;
}
