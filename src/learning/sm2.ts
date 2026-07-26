import { DRILL_CELL_TOTAL } from "@/data/strategy/charts";

/** Simplified SM-2 for strategy cells */

export interface CardMemory {
  easiness: number;
  interval: number;
  repetitions: number;
  dueAt: number;
  lastResult: "again" | "good" | null;
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function defaultMemory(): CardMemory {
  return {
    easiness: 2.5,
    interval: 0,
    repetitions: 0,
    dueAt: 0,
    lastResult: null,
  };
}

export function review(
  mem: CardMemory,
  correct: boolean,
  now = Date.now(),
): CardMemory {
  const quality = correct ? 4 : 1;
  let { easiness, interval, repetitions } = mem;

  if (quality < 3) {
    repetitions = 0;
    interval = 0;
  } else {
    if (repetitions === 0) interval = 0;
    else if (repetitions === 1) interval = 1;
    else interval = Math.round(interval * easiness);
    repetitions += 1;
  }

  easiness = Math.max(
    1.3,
    easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  // Early reviews: short delay so the same session can strengthen a cell.
  // Later: day-scale SM-2 intervals.
  let dueAt: number;
  if (quality < 3) {
    dueAt = now; // wrong → immediately due again
  } else if (repetitions === 1) {
    dueAt = now + 12 * MINUTE_MS;
  } else if (repetitions === 2) {
    dueAt = now + DAY_MS;
  } else {
    dueAt = now + interval * DAY_MS;
  }

  return {
    easiness,
    interval,
    repetitions,
    dueAt,
    lastResult: correct ? "good" : "again",
  };
}

export function isDue(mem: CardMemory | undefined, now = Date.now()): boolean {
  if (!mem) return true;
  return mem.dueAt <= now;
}

/** Seen once correctly — on the path to solid. */
export function isLearning(mem: CardMemory): boolean {
  return mem.repetitions === 1 && mem.lastResult === "good";
}

export function isSolid(mem: CardMemory): boolean {
  return (
    mem.repetitions >= 3 && mem.easiness >= 2.2 && mem.interval >= 1
  );
}

/** Partial credit so early practice moves the mastery bar. */
function cellProgress(mem: CardMemory): number {
  if (isSolid(mem)) return 1;
  if (mem.repetitions >= 2 && mem.lastResult === "good") return 0.7;
  if (isLearning(mem)) return 0.4;
  if (mem.lastResult === "again") return 0.12;
  if (mem.repetitions > 0) return 0.2;
  return 0;
}

export function masteryScore(memories: Record<string, CardMemory>): {
  percent: number;
  solid: number;
  learning: number;
  total: number;
  weak: number;
  due: number;
} {
  const expected = DRILL_CELL_TOTAL;
  const entries = Object.values(memories);
  const solid = entries.filter(isSolid).length;
  const learning = entries.filter(isLearning).length;
  const weak = entries.filter((m) => m.lastResult === "again").length;
  const due = entries.filter((m) => isDue(m)).length;
  const touched = entries.length;
  const unseen = Math.max(0, expected - touched);

  const score = entries.reduce((sum, m) => sum + cellProgress(m), 0);
  let percent = Math.min(100, Math.round((score / expected) * 100));
  // At least 1% once any real progress exists (avoid "half hour still 0%")
  if (score > 0 && percent === 0) percent = 1;

  return {
    percent,
    solid,
    learning,
    total: expected,
    weak,
    due: due + unseen,
  };
}

export function countByKind(
  memories: Record<string, CardMemory>,
  kind: "hard" | "soft" | "pair",
): { solid: number; weak: number; total: number; percent: number } {
  const totals = { hard: 100, soft: 80, pair: 100 } as const;
  const total = totals[kind];
  const prefix = `${kind}:`;
  let score = 0;
  let solid = 0;
  let weak = 0;
  for (const [id, mem] of Object.entries(memories)) {
    if (!id.startsWith(prefix)) continue;
    score += cellProgress(mem);
    if (isSolid(mem)) solid += 1;
    if (mem.lastResult === "again") weak += 1;
  }
  let percent = Math.min(100, Math.round((score / total) * 100));
  if (score > 0 && percent === 0) percent = 1;
  return {
    solid,
    weak,
    total,
    percent,
  };
}

/** Human label for a drill cell id like `hard:16:10` → `16 vs 10`. */
export function cellDisplayLabel(id: string): string {
  const [kind, player, dealer] = id.split(":");
  const d = dealer === "1" ? "A" : dealer;
  if (kind === "pair") {
    const p = player === "A" ? "A,A" : `${player},${player}`;
    return `${p} vs ${d}`;
  }
  if (kind === "soft") {
    const soft = Number(player);
    const kicker = Number.isFinite(soft) ? soft - 11 : player;
    return `A${kicker} vs ${d}`;
  }
  return `${player} vs ${d}`;
}

export function weakFocusCells(
  memories: Record<string, CardMemory>,
  limit = 3,
): { id: string; label: string; kind: "hard" | "soft" | "pair" }[] {
  const weak = Object.entries(memories)
    .filter(([, m]) => m.lastResult === "again")
    .sort((a, b) => (a[1].dueAt ?? 0) - (b[1].dueAt ?? 0));

  const out: { id: string; label: string; kind: "hard" | "soft" | "pair" }[] =
    [];
  for (const [id] of weak) {
    const kind = id.split(":")[0];
    if (kind !== "hard" && kind !== "soft" && kind !== "pair") continue;
    out.push({ id, label: cellDisplayLabel(id), kind });
    if (out.length >= limit) break;
  }
  return out;
}
