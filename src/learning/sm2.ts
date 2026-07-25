import { DRILL_CELL_TOTAL } from "@/data/strategy/charts";

/** Simplified SM-2 for strategy cells */

export interface CardMemory {
  easiness: number;
  interval: number;
  repetitions: number;
  dueAt: number;
  lastResult: "again" | "good" | null;
}

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
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easiness);
    repetitions += 1;
  }

  easiness = Math.max(
    1.3,
    easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  const dayMs = 24 * 60 * 60 * 1000;
  const dueAt = now + interval * dayMs;

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

export function isSolid(mem: CardMemory): boolean {
  return mem.repetitions >= 2 && mem.easiness >= 2.2;
}

export function masteryScore(memories: Record<string, CardMemory>): {
  percent: number;
  solid: number;
  total: number;
  weak: number;
  due: number;
} {
  const expected = DRILL_CELL_TOTAL;
  const entries = Object.values(memories);
  const solid = entries.filter(isSolid).length;
  const weak = entries.filter((m) => m.lastResult === "again").length;
  const due = entries.filter((m) => isDue(m)).length;
  // Unseen cells also "due" for learning pressure — approximate via expected - touched
  const touched = entries.length;
  const unseen = Math.max(0, expected - touched);
  const percent = Math.min(100, Math.round((solid / expected) * 100));
  return {
    percent,
    solid,
    total: expected,
    weak,
    due: due + unseen,
  };
}

export function countByKind(
  memories: Record<string, CardMemory>,
  kind: "hard" | "soft" | "pair",
): { solid: number; weak: number } {
  const prefix = `${kind}:`;
  let solid = 0;
  let weak = 0;
  for (const [id, mem] of Object.entries(memories)) {
    if (!id.startsWith(prefix)) continue;
    if (isSolid(mem)) solid += 1;
    if (mem.lastResult === "again") weak += 1;
  }
  return { solid, weak };
}
