import { describe, expect, it } from "vitest";
import { getAdvice, getInsuranceAdvice } from "./advise";
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

  it("H17 peek: doubles soft 19 vs 4 and 5", () => {
    const h17: TableRules = { ...peek, soft17: "H17" };
    expect(getAdvice([1, 8], 4, h17)?.action).toBe("double");
    expect(getAdvice([1, 8], 5, h17)?.action).toBe("double");
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

  it("splits pairs of 6 vs 5 and 6 on peek", () => {
    expect(getAdvice([6, 6], 5, peek)?.action).toBe("split");
    expect(getAdvice([6, 6], 6, peek)?.action).toBe("split");
  });

  it("surrender fallback: Rh becomes hit when surrender off", () => {
    const a = getAdvice([10, 6], 10, { ...peek, surrender: false });
    expect(a?.action).toBe("hit");
    expect(a?.fallbackNote).toMatch(/Resa/);
  });

  it("surrender when allowed: hard 16 vs 10", () => {
    const a = getAdvice([10, 6], 10, { ...peek, surrender: true });
    expect(a?.action).toBe("surrender");
  });

  it("soft 14 (A,3) vs 4 hits; soft 15 (A,4) vs 5 doubles when double any", () => {
    const sv = { ...enhc, double: "any" as const };
    expect(getAdvice([1, 3], 4, sv)?.action).toBe("hit");
    expect(getAdvice([1, 4], 5, sv)?.action).toBe("double");
    expect(getAdvice([1, 3], 5, sv)?.action).toBe("double");
  });

  it("soft doubles fall back to hit under EU 9–11 double", () => {
    expect(getAdvice([1, 4], 5, enhc)?.action).toBe("hit");
    expect(getAdvice([1, 4], 5, enhc)?.fallbackNote).toMatch(/Raddoppio/);
  });

  it("insurance basic strategy is always no", () => {
    const a = getInsuranceAdvice(1);
    expect(a.action).toBe("insurance_no");
    expect(a.reason).toMatch(/Rifiuta/);
  });

  it("DAS off: Ph pairs hit with note", () => {
    const noDas: TableRules = { ...peek, das: false };
    const a = getAdvice([2, 2], 2, noDas);
    expect(a?.action).toBe("hit");
    expect(a?.fallbackNote).toMatch(/DAS/);
  });

  it("H17: hard 17 vs Ace surrenders when allowed else stands", () => {
    const h17: TableRules = { ...peek, soft17: "H17", surrender: true };
    expect(getAdvice([10, 7], 1, h17)?.action).toBe("surrender");
    const noSur: TableRules = { ...peek, soft17: "H17", surrender: false };
    expect(getAdvice([10, 7], 1, noSur)?.action).toBe("stand");
    expect(getAdvice([10, 7], 1, noSur)?.fallbackNote).toMatch(/Resa/);
  });

  it("ENHC no-extra reason only on demoted money spots", () => {
    const e11 = getAdvice([5, 6], 10, enhc);
    expect(e11?.reason).toMatch(/soldi extra/);
    const e16 = getAdvice([10, 6], 10, enhc);
    expect(e16?.reason).not.toMatch(/soldi extra/);
  });
});
