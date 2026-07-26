"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  evaluateHand,
  getAdvice,
  getInsuranceAdvice,
  handLabel,
  rulesLabel,
  type DealerUp,
  type Rank,
} from "@/engine";
import { useIsClient, useRules } from "@/lib/client";
import { feedback } from "@/lib/feedback";
import { RankPicker } from "@/components/ui/RankPicker";
import {
  LoadingMark,
  PageEnter,
  StepRail,
} from "@/components/ui/PageChrome";
import { PageHeader } from "@/components/ui/PageHeader";
import { HandStage } from "@/components/ui/HandStage";
import { popIn } from "@/lib/motion";

type Phase = "dealer" | "insurance" | "cards" | "result";

export default function TavoloPage() {
  const isClient = useIsClient();
  const rules = useRules();
  const reduceMotion = useReducedMotion();
  const [dealer, setDealer] = useState<DealerUp | null>(null);
  const [cards, setCards] = useState<Rank[]>([]);
  const [phase, setPhase] = useState<Phase>("dealer");
  const [splitHands, setSplitHands] = useState<[Rank[], Rank[]] | null>(null);
  const [activeSplit, setActiveSplit] = useState<0 | 1>(0);
  const [insuranceSeen, setInsuranceSeen] = useState(false);
  /** After a double, that hand is locked (one card only, then stop). */
  const [doubleLocked, setDoubleLocked] = useState(false);
  const [splitDoubleLocked, setSplitDoubleLocked] = useState<
    [boolean, boolean]
  >([false, false]);

  const activeCards = splitHands ? splitHands[activeSplit] : cards;
  const hand = evaluateHand(activeCards);
  const handDoubled = splitHands
    ? splitDoubleLocked[activeSplit]
    : doubleLocked;

  const advice = useMemo(() => {
    if (dealer == null || activeCards.length < 2) return null;
    // After double the hand is closed — no further strategy lookup.
    if (handDoubled) return null;
    return getAdvice(activeCards, dealer, rules);
  }, [rules, dealer, activeCards, handDoubled]);

  const insurance = useMemo(() => getInsuranceAdvice(1), []);
  const bustAnnounced = useRef(false);
  const isBustPreview = evaluateHand(
    splitHands ? splitHands[activeSplit] : cards,
  ).busted;

  useEffect(() => {
    if (isBustPreview && phase === "result" && !bustAnnounced.current) {
      bustAnnounced.current = true;
      feedback("bust");
    }
    if (!isBustPreview) bustAnnounced.current = false;
  }, [isBustPreview, phase]);

  const selectDealer = useCallback((r: Rank) => {
    setDealer(r);
    setCards([]);
    setSplitHands(null);
    setDoubleLocked(false);
    setSplitDoubleLocked([false, false]);
    if (r === 1) {
      setPhase("insurance");
      setInsuranceSeen(false);
    } else {
      setPhase("cards");
    }
  }, []);

  useEffect(() => {
    if (phase !== "insurance") return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      setInsuranceSeen(true);
      setPhase("cards");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  if (!isClient) return <LoadingMark />;

  const stepIndex =
    phase === "dealer"
      ? 0
      : phase === "insurance" || phase === "cards"
        ? 1
        : 2;

  function reset() {
    setDealer(null);
    setCards([]);
    setSplitHands(null);
    setActiveSplit(0);
    setPhase("dealer");
    setInsuranceSeen(false);
    setDoubleLocked(false);
    setSplitDoubleLocked([false, false]);
  }

  function markDoubleLocked() {
    if (splitHands) {
      setSplitDoubleLocked((prev) => {
        const next: [boolean, boolean] = [...prev];
        next[activeSplit] = true;
        return next;
      });
    } else {
      setDoubleLocked(true);
    }
  }

  function clearDoubleLockedOnUndo() {
    if (splitHands) {
      setSplitDoubleLocked((prev) => {
        const next: [boolean, boolean] = [...prev];
        next[activeSplit] = false;
        return next;
      });
    } else {
      setDoubleLocked(false);
    }
  }

  function undo() {
    if (splitHands) {
      const next = [...splitHands] as [Rank[], Rank[]];
      if (next[activeSplit].length > 1) {
        const wasDoubled = splitDoubleLocked[activeSplit];
        next[activeSplit] = next[activeSplit].slice(0, -1);
        setSplitHands(next);
        if (wasDoubled) clearDoubleLockedOnUndo();
        setPhase(next[activeSplit].length < 2 ? "cards" : "result");
      }
      return;
    }
    if (cards.length > 0) {
      const next = cards.slice(0, -1);
      const wasDoubled = doubleLocked;
      setCards(next);
      if (wasDoubled) setDoubleLocked(false);
      setPhase(next.length < 2 ? "cards" : "result");
      return;
    }
    if (phase === "insurance" || phase === "cards") {
      if (dealer === 1 && insuranceSeen) {
        setInsuranceSeen(false);
        setPhase("insurance");
        return;
      }
      setDealer(null);
      setPhase("dealer");
      setInsuranceSeen(false);
    }
  }

  function dismissInsurance() {
    setInsuranceSeen(true);
    setPhase("cards");
  }

  function addCard(r: Rank) {
    const awaitingDouble =
      phase === "result" &&
      !handDoubled &&
      activeCards.length === 2 &&
      advice?.action === "double";

    if (splitHands) {
      const next = [...splitHands] as [Rank[], Rank[]];
      next[activeSplit] = [...next[activeSplit], r];
      setSplitHands(next);
      if (awaitingDouble) markDoubleLocked();
      setPhase("result");
      return;
    }
    const next = [...cards, r];
    setCards(next);
    if (awaitingDouble) {
      setDoubleLocked(true);
      setPhase("result");
      return;
    }
    if (next.length >= 2 && dealer != null) setPhase("result");
  }

  function doSplit() {
    if (cards.length !== 2 || cards[0] !== cards[1]) return;
    setSplitHands([[cards[0]], [cards[1]]]);
    setActiveSplit(0);
    setDoubleLocked(false);
    setSplitDoubleLocked([false, false]);
    setPhase("cards");
  }

  const isBust = hand.busted;
  const doubleResolved = handDoubled && activeCards.length >= 3;

  const awaitingDoubleCard =
    phase === "result" &&
    !isBust &&
    !handDoubled &&
    activeCards.length === 2 &&
    advice?.action === "double";

  const needsHit =
    !handDoubled &&
    advice?.action === "hit" &&
    !hand.busted &&
    hand.total < 21 &&
    !hand.isBlackjack;

  const showHitPicker =
    phase === "result" &&
    !awaitingDoubleCard &&
    !doubleResolved &&
    !!advice &&
    !isBust &&
    ((splitHands != null && splitHands[activeSplit].length < 2) ||
      needsHit ||
      (splitHands != null &&
        advice.action === "hit" &&
        !hand.busted &&
        hand.total < 21));

  const showSplitTrack =
    phase === "result" &&
    !handDoubled &&
    advice?.action === "split" &&
    !splitHands;

  const showResultPanel =
    phase === "result" && (advice != null || doubleResolved || isBust);

  const showNewHand =
    phase === "result" &&
    (isBust ||
      doubleResolved ||
      (!!advice &&
        !awaitingDoubleCard &&
        !showHitPicker &&
        !showSplitTrack));

  const motionIn = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : popIn;

  const resultTitle = isBust
    ? "Sballato"
    : doubleResolved
      ? handLabel(activeCards)
      : advice?.label ?? "";

  const resultReason = isBust
    ? "Hai superato 21. La mano è chiusa."
    : doubleResolved
      ? "Raddoppio concluso — una sola carta, poi stop."
      : (advice?.reason ?? "");

  return (
    <PageEnter>
      <PageHeader
        eyebrow="Tavolo"
        title="Consulto"
        rulesLabel={rulesLabel(rules)}
        actions={
          <>
            <button type="button" onClick={undo} className="ghost-btn">
              Annulla
            </button>
            <button type="button" onClick={reset} className="ghost-btn">
              Nuova
            </button>
          </>
        }
      />

      <div className="mt-5">
        <StepRail steps={["Banco", "Tu", "Mossa"]} current={stepIndex} />
      </div>

      <HandStage
        dealer={dealer}
        playerCards={activeCards}
        playerHandLabel={
          activeCards.length >= 2 ? handLabel(activeCards) : null
        }
      />

      {splitHands && (
        <div className="mt-4 flex justify-center gap-2">
          {([0, 1] as const).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveSplit(i);
                setPhase(splitHands[i].length < 2 ? "cards" : "result");
              }}
              className={`min-h-11 rounded-full px-4 py-2.5 text-sm font-semibold ${
                activeSplit === i
                  ? "bg-champagne text-felt-deep"
                  : "bg-felt-card/70 text-mist"
              }`}
            >
              Mano {i === 0 ? "A" : "B"} ·{" "}
              {evaluateHand(splitHands[i]).total || "—"}
              {splitDoubleLocked[i] ? " · D" : ""}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "insurance" && dealer === 1 && (
          <motion.div
            key="ins"
            {...motionIn}
            className="surface mt-8 rounded-3xl p-5 text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-champagne-bright">
              Assicurazione
            </p>
            <p className="mt-2 font-display text-4xl text-champagne-bright">
              {insurance.label}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-mist">
              {insurance.reason}
            </p>
            <button
              type="button"
              onClick={dismissInsurance}
              className="btn-primary mt-5"
            >
              Ok, le mie carte
            </button>
          </motion.div>
        )}

        {showResultPanel && (
          <motion.div
            key={
              (advice?.label ?? "done") +
              String(handDoubled) +
              activeCards.join("-")
            }
            {...motionIn}
            className="mt-8 text-center"
          >
            <div className="surface mx-auto max-w-sm rounded-3xl px-5 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-champagne-bright">
                {isBust || doubleResolved ? "Risultato" : "Mossa"}
              </p>
              <p
                className={`mt-2 font-display text-6xl font-semibold ${
                  isBust ? "text-danger" : "text-champagne-bright"
                }`}
              >
                {resultTitle}
              </p>
              <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-mist">
                {resultReason}
              </p>
              {!isBust && !doubleResolved && advice?.fallbackNote && (
                <p className="mt-3 text-sm text-champagne-bright">
                  {advice.fallbackNote}
                </p>
              )}
            </div>
            {showSplitTrack && (
              <button
                type="button"
                onClick={doSplit}
                className="btn-secondary mx-auto mt-4 max-w-xs"
              >
                Traccia lo split
              </button>
            )}
            {awaitingDoubleCard && (
              <div className="mt-6">
                <RankPicker
                  label="Carta del raddoppio"
                  value={null}
                  onSelect={addCard}
                />
              </div>
            )}
            {showHitPicker && (
              <div className="mt-6">
                <RankPicker
                  label={
                    splitHands && splitHands[activeSplit].length < 2
                      ? "Seconda carta dello split"
                      : "Carta pescata"
                  }
                  value={null}
                  onSelect={addCard}
                />
              </div>
            )}
            {showNewHand && (
              <button
                type="button"
                onClick={reset}
                className="btn-primary mx-auto mt-6 max-w-xs"
              >
                Nuova mano
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "dealer" && (
        <div className="mt-8">
          <RankPicker
            label="Carta del banco"
            value={dealer}
            onSelect={selectDealer}
          />
        </div>
      )}

      {phase === "cards" && (
        <div className="mt-8">
          <RankPicker
            label={
              splitHands
                ? `Carta mano ${activeSplit === 0 ? "A" : "B"}`
                : cards.length === 0
                  ? "Prima carta"
                  : "Seconda carta"
            }
            value={null}
            onSelect={addCard}
          />
        </div>
      )}
    </PageEnter>
  );
}
