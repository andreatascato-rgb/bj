import { describe, expect, it } from "vitest";
import { getAdvice } from "./advise";
import { DEFAULT_RULES, type TableRules } from "./types";

const peek: TableRules = {
  ...DEFAULT_RULES,
  holeCard: "peek",
  double: "any",
};

const enhc = DEFAULT_RULES;

describe("basic strategy engine", () => {
  it("stands hard 16 vs 6", () => {
    const a = getAdvice([10, 6], 6, peek);
    expect(a?.action).toBe("stand");
  });

  it("hits hard 16 vs 10", () => {
    const a = getAdvice([10, 6], 10, peek);
    expect(a?.action).toBe("hit");
  });

  it("splits 8s vs 10 on peek", () => {
    const a = getAdvice([8, 8], 10, peek);
    expect(a?.action).toBe("split");
  });

  it("ENHC: hits 11 vs 10 instead of double", () => {
    const p = getAdvice([5, 6], 10, peek);
    const e = getAdvice([5, 6], 10, enhc);
    expect(p?.action).toBe("double");
    expect(e?.action).toBe("hit");
  });

  it("ENHC: hits 8,8 vs Ace instead of split", () => {
    const p = getAdvice([8, 8], 1, peek);
    const e = getAdvice([8, 8], 1, enhc);
    expect(p?.action).toBe("split");
    expect(e?.action).toBe("hit");
  });

  it("ENHC: hits A,A vs Ace", () => {
    const e = getAdvice([1, 1], 1, enhc);
    expect(e?.action).toBe("hit");
  });

  it("H17 peek: doubles 11 vs Ace", () => {
    const h17: TableRules = { ...peek, soft17: "H17" };
    const a = getAdvice([5, 6], 1, h17);
    expect(a?.action).toBe("double");
  });

  it("ENHC wins over H17 on 11 vs Ace", () => {
    const both: TableRules = { ...enhc, soft17: "H17" };
    const a = getAdvice([5, 6], 1, both);
    expect(a?.action).toBe("hit");
  });

  it("OBO uses peek chart (splits 8s vs Ace)", () => {
    const obo: TableRules = { ...peek, holeCard: "obo" };
    const a = getAdvice([8, 8], 1, obo);
    expect(a?.action).toBe("split");
  });

  it("EU double limit notes fallback on soft 18", () => {
    const a = getAdvice([1, 7], 6, enhc);
    expect(a?.action).toBe("stand");
    expect(a?.fallbackNote).toMatch(/Raddoppio/);
  });

  it("soft 18 vs 9 hits", () => {
    const a = getAdvice([1, 7], 9, peek);
    expect(a?.action).toBe("hit");
  });

  it("EU double limit: soft 18 vs 6 becomes stand not double", () => {
    const a = getAdvice([1, 7], 6, enhc);
    expect(a?.action).toBe("stand");
  });

  it("never splits tens", () => {
    const a = getAdvice([10, 10], 6, peek);
    expect(a?.action).toBe("stand");
  });
});
