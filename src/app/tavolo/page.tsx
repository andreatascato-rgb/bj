"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import Link from "next/link";
import { PlayingCard, RankPicker } from "@/components/ui/RankPicker";
import {
  LoadingMark,
  PageEnter,
  StepRail,
} from "@/components/ui/PageChrome";
import { popIn } from "@/lib/motion";

type Phase = "dealer" | "insurance" | "cards" | "result";

export default function TavoloPage() {
  const isClient = useIsClient();
  const rules = useRules();
  const [dealer, setDealer] = useState<DealerUp | null>(null);
  const [cards, setCards] = useState<Rank[]>([]);
  const [phase, setPhase] = useState<Phase>("dealer");
  const [splitHands, setSplitHands] = useState<[Rank[], Rank[]] | null>(null);
  const [activeSplit, setActiveSplit] = useState<0 | 1>(0);
  const [insuranceSeen, setInsuranceSeen] = useState(false);

  const activeCards = splitHands ? splitHands[activeSplit] : cards;
  const hand = evaluateHand(activeCards);

  const advice = useMemo(() => {
    if (dealer == null || activeCards.length < 2) return null;
    return getAdvice(activeCards, dealer, rules);
  }, [rules, dealer, activeCards]);

  const insurance = useMemo(() => getInsuranceAdvice(1), []);

  const selectDealer = useCallback((r: Rank) => {
    setDealer(r);
    setCards([]);
    setSplitHands(null);
    if (r === 1) {
      setPhase("insurance");
      setInsuranceSeen(false);
    } else {
      setPhase("cards");
    }
  }, []);

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
  }

  function undo() {
    if (splitHands) {
      const next = [...splitHands] as [Rank[], Rank[]];
      if (next[activeSplit].length > 1) {
        next[activeSplit] = next[activeSplit].slice(0, -1);
        setSplitHands(next);
        setPhase(next[activeSplit].length < 2 ? "cards" : "result");
      }
      return;
    }
    if (cards.length > 0) {
      const next = cards.slice(0, -1);
      setCards(next);
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
    if (splitHands) {
      const next = [...splitHands] as [Rank[], Rank[]];
      next[activeSplit] = [...next[activeSplit], r];
      setSplitHands(next);
      setPhase("result");
      return;
    }
    const next = [...cards, r];
    setCards(next);
    if (next.length >= 2 && dealer != null) setPhase("result");
  }

  function doSplit() {
    if (cards.length !== 2 || cards[0] !== cards[1]) return;
    setSplitHands([[cards[0]], [cards[1]]]);
    setActiveSplit(0);
    setPhase("cards");
  }

  const isBust = hand.busted;
  const needsHit =
    advice?.action === "hit" &&
    !hand.busted &&
    hand.total < 21 &&
    !hand.isBlackjack;
  const showHitPicker =
    phase === "result" &&
    !!advice &&
    !isBust &&
    ((splitHands != null && splitHands[activeSplit].length < 2) ||
      needsHit ||
      (splitHands != null &&
        advice.action === "hit" &&
        !hand.busted &&
        hand.total < 21));
  const showSplitTrack =
    phase === "result" && advice?.action === "split" && !splitHands;
  const showNewHand =
    phase === "result" &&
    !!advice &&
    (isBust || (!showHitPicker && !showSplitTrack));

  return (
    <PageEnter>
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne-bright">
            Tavolo
          </p>
          <h1 className="font-display text-3xl text-ivory">Consulto</h1>
          <Link
            href="/regole/"
            className="mt-1 inline-block text-[10px] font-semibold tracking-wide text-champagne-bright/80 no-underline"
          >
            {rulesLabel(rules)}
          </Link>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={undo} className="ghost-btn">
            Annulla
          </button>
          <button type="button" onClick={reset} className="ghost-btn">
            Nuova
          </button>
        </div>
      </header>

      <div className="mt-5">
        <StepRail steps={["Banco", "Tu", "Mossa"]} current={stepIndex} />
      </div>

      <div className="mt-8 flex items-end justify-center gap-4">
        <div className="text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-mist">
            Banco
          </p>
          {dealer != null ? (
            <PlayingCard rank={dealer} delay={0} />
          ) : (
            <PlayingCard rank={null} />
          )}
        </div>
        <div className="mb-10 h-px w-6 bg-champagne/30" />
        <div className="text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-mist">
            Tu
            {activeCards.length >= 2
              ? ` · ${handLabel(activeCards)}`
              : ""}
          </p>
          <div className="flex gap-2">
            {activeCards.length === 0 ? (
              <PlayingCard rank={null} />
            ) : (
              activeCards.map((c, i) => (
                <PlayingCard key={`${c}-${i}`} rank={c} delay={i * 0.05} />
              ))
            )}
          </div>
        </div>
      </div>

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
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                activeSplit === i
                  ? "bg-champagne text-felt-deep"
                  : "bg-felt-card/70 text-mist"
              }`}
            >
              Mano {i === 0 ? "A" : "B"} ·{" "}
              {evaluateHand(splitHands[i]).total || "—"}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "insurance" && dealer === 1 && (
          <motion.div
            key="ins"
            {...popIn}
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

        {phase === "result" && advice && (
          <motion.div
            key={advice.label + advice.playerKey + activeCards.join("-")}
            {...popIn}
            className="mt-8 text-center"
          >
            <div className="surface mx-auto max-w-sm rounded-3xl px-5 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-champagne-bright">
                {isBust ? "Risultato" : "Mossa"}
              </p>
              <p
                className={`mt-2 font-display text-6xl font-semibold ${
                  isBust ? "text-danger" : "text-champagne-bright"
                }`}
              >
                {isBust ? "Sballato" : advice.label}
              </p>
              <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-mist">
                {isBust
                  ? "Hai superato 21. La mano è chiusa."
                  : advice.reason}
              </p>
              {!isBust && advice.fallbackNote && (
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
