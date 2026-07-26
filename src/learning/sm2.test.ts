import { describe, expect, it } from "vitest";
import {
  defaultMemory,
  isSolid,
  masteryScore,
  review,
} from "./sm2";

describe("SM-2 learning", () => {
  it("first correct is learning, not solid", () => {
    const m = review(defaultMemory(), true);
    expect(m.repetitions).toBe(1);
    expect(isSolid(m)).toBe(false);
  });

  it("needs 3 correct reps with interval ≥ 1 to be solid", () => {
    let m = defaultMemory();
    m = review(m, true);
    m = review(m, true);
    expect(isSolid(m)).toBe(false);
    m = review(m, true);
    expect(m.repetitions).toBe(3);
    expect(m.interval).toBeGreaterThanOrEqual(1);
    expect(isSolid(m)).toBe(true);
  });

  it("wrong answer resets repetitions", () => {
    let m = defaultMemory();
    m = review(m, true);
    m = review(m, true);
    m = review(m, false);
    expect(m.repetitions).toBe(0);
    expect(m.lastResult).toBe("again");
    expect(isSolid(m)).toBe(false);
  });

  it("mastery moves with early progress", () => {
    const empty = masteryScore({});
    expect(empty.percent).toBe(0);
    const one = masteryScore({
      "hard:16:10": review(defaultMemory(), true),
    });
    expect(one.percent).toBeGreaterThan(0);
  });
});
