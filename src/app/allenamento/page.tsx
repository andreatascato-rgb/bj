"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ACTION_LABELS,
  allDrillCells,
  getAdvice,
  type Action,
  type Advice,
} from "@/engine";
import { isDue, masteryScore, review } from "@/learning/sm2";
import { useIsClient, useRules } from "@/lib/client";
import {
  getOrCreateMemory,
  loadMemory,
  upsertMemory,
} from "@/lib/storage";
import { PlayingCard } from "@/components/ui/RankPicker";
import { LoadingMark, PageEnter } from "@/components/ui/PageChrome";

const CHOICES: Action[] = ["hit", "stand", "double", "split", "surrender"];

function buildQueue(
  warmup: boolean,
  kindFilter: "hard" | "soft" | "pair" | undefined,
) {
  const cells = allDrillCells(kindFilter);
  const mem = loadMemory();
  const masteryStart = masteryScore(mem).percent;
  const due = cells.filter((c) => isDue(mem[c.id]));
  const weak = cells.filter((c) => mem[c.id]?.lastResult === "again");
  const pool = warmup
    ? weak.length
      ? weak
      : due.length
        ? due
        : cells
    : due.length
      ? due
      : cells;
  const size = warmup ? 20 : kindFilter ? 30 : 40;
  return {
    queue: shuffle(pool).slice(0, Math.min(size, pool.length || 1)),
    masteryStart,
  };
}

function DrillInner() {
  const params = useSearchParams();
  const warmup = params.get("mode") === "warmup";
  const kindParam = params.get("kind");
  const kindFilter =
    kindParam === "hard" || kindParam === "soft" || kindParam === "pair"
      ? kindParam
      : undefined;

  const isClient = useIsClient();
  const rules = useRules();
  const [sessionKey, setSessionKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Action | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAsked, setTotalAsked] = useState(0);
  const [done, setDone] = useState(false);

  const session = useMemo(() => {
    if (!isClient) return null;
    void sessionKey;
    return buildQueue(warmup, kindFilter);
  }, [isClient, warmup, kindFilter, sessionKey]);

  const queue = session?.queue ?? [];
  const masteryStart = session?.masteryStart ?? 0;

  function rebuild() {
    setSessionKey((k) => k + 1);
    setIndex(0);
    setPicked(null);
    setCorrectCount(0);
    setTotalAsked(0);
    setDone(false);
  }

  const current = queue[index];
  const advice = useMemo(() => {
    if (!current) return null;
    return getAdvice(current.cards, current.dealerUp, rules);
  }, [rules, current]);

  const next = useCallback(() => {
    setPicked(null);
    setIndex((i) => {
      const n = i + 1;
      if (n >= queue.length) setDone(true);
      return n;
    });
  }, [queue.length]);

  function answer(a: Action) {
    if (!current || !advice || picked) return;
    const ok = a === advice.action;
    setPicked(a);
    setTotalAsked((t) => t + 1);
    if (ok) setCorrectCount((c) => c + 1);
    const mem = getOrCreateMemory(current.id);
    upsertMemory(current.id, review(mem, ok));
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ok ? [10] : [20, 30, 20]);
    }
  }

  if (!isClient || !session) {
    return <LoadingMark label="Carte…" />;
  }

  if (done || (queue.length > 0 && index >= queue.length)) {
    const pct = totalAsked ? Math.round((correctCount / totalAsked) * 100) : 0;
    const masteryNow = masteryScore(loadMemory()).percent;
    const delta = masteryNow - masteryStart;
    const nextKind =
      kindFilter === "hard"
        ? "soft"
        : kindFilter === "soft"
          ? "pair"
          : kindFilter === "pair"
            ? null
            : "hard";

    return (
      <PageEnter className="items-center justify-center text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne-bright">
          {warmup ? "Warm-up finito" : "Sessione finita"}
        </p>
        <p className="mt-3 font-display text-5xl text-champagne-bright">
          {pct}%
        </p>
        <p className="mt-3 text-mist">
          {correctCount}/{totalAsked} corrette
          {delta !== 0 && (
            <>
              {" "}
              · mastery {delta > 0 ? "+" : ""}
              {delta}%
            </>
          )}
        </p>
        <p className="mt-2 max-w-xs text-sm text-mist">
          {warmup
            ? "Sei più caldo. Se vai al casinò, ripassa solo i dubbi a mente."
            : "Continua così: la memoria si solidifica con ripetizioni brevi."}
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button type="button" onClick={rebuild} className="btn-primary">
            Ancora questa sessione
          </button>
          {nextKind && (
            <Link
              href={`/allenamento/?kind=${nextKind}`}
              className="btn-secondary no-underline"
            >
              Passa a{" "}
              {nextKind === "hard"
                ? "Hard"
                : nextKind === "soft"
                  ? "Soft"
                  : "Coppie"}
            </Link>
          )}
          {warmup && (
            <Link href="/tavolo/" className="btn-secondary no-underline">
              Apri Tavolo
            </Link>
          )}
          <Link
            href="/"
            className="py-2 text-sm font-medium text-mist no-underline hover:text-ivory"
          >
            Torna allo Studio
          </Link>
        </div>
      </PageEnter>
    );
  }

  if (!current || !advice) {
    return <LoadingMark label="Carte…" />;
  }

  const revealed = picked !== null;
  const ok = picked === advice.action;
  const progress = ((index + (revealed ? 1 : 0)) / Math.max(queue.length, 1)) * 100;
  const title = warmup
    ? "Warm-up"
    : kindFilter === "hard"
      ? "Hard"
      : kindFilter === "soft"
        ? "Soft"
        : kindFilter === "pair"
          ? "Coppie"
          : "Allenamento";

  return (
    <PageEnter>
      <header>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne-bright">
              {title}
            </p>
            <h1 className="font-display text-3xl text-ivory">
              {index + 1}
              <span className="text-mist">/{queue.length}</span>
            </h1>
          </div>
          <Link href="/" className="ghost-btn no-underline">
            Esci
          </Link>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-mist">
          <span>{correctCount} ok finora</span>
          <span>~{Math.max(1, queue.length - index)} rimaste</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-felt-card/70">
          <motion.div
            className="h-full rounded-full bg-champagne"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
        {!warmup && (
          <div className="mt-4 flex gap-2">
            {(
              [
                ["", "Tutti"],
                ["hard", "Hard"],
                ["soft", "Soft"],
                ["pair", "Coppie"],
              ] as const
            ).map(([k, label]) => {
              const active = (kindFilter ?? "") === k;
              const href = k ? `/allenamento/?kind=${k}` : "/allenamento/";
              return (
                <a
                  key={label}
                  href={href}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold no-underline ${
                    active
                      ? "bg-champagne text-felt-deep"
                      : "bg-felt-card/50 text-mist"
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </div>
        )}
      </header>

      <div className="mt-8 flex justify-center gap-5">
        <div className="text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-mist">
            Banco
          </p>
          <PlayingCard rank={current.dealerUp} />
        </div>
        <div className="text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-mist">
            Tu
          </p>
          <div className="flex gap-2">
            {current.cards.map((c, i) => (
              <PlayingCard key={i} rank={c} delay={i * 0.04} />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-7 text-center text-sm font-medium text-mist">
        Cosa fai in questa mano?
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {CHOICES.filter((c) => c !== "surrender" || rules.surrender).map(
          (c) => {
            const isRight = revealed && c === advice.action;
            const isWrong = revealed && c === picked && !ok;
            return (
              <motion.button
                key={c}
                type="button"
                whileTap={{ scale: 0.97 }}
                disabled={revealed}
                onClick={() => answer(c)}
                className={`min-h-14 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                  isRight
                    ? "border-ok bg-ok/20 text-ok"
                    : isWrong
                      ? "border-danger bg-danger/20 text-danger"
                      : "border-ivory/15 bg-felt-deep/45 text-ivory"
                }`}
              >
                {ACTION_LABELS[c]}
              </motion.button>
            );
          },
        )}
      </div>

      {revealed && <Feedback advice={advice} ok={ok} onNext={next} />}
    </PageEnter>
  );
}

function Feedback({
  advice,
  ok,
  onNext,
}: {
  advice: Advice;
  ok: boolean;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface mt-6 rounded-3xl p-5"
    >
      <p className={`font-display text-3xl ${ok ? "text-ok" : "text-danger"}`}>
        {ok ? "Corretto" : "Quasi"}
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-mist">{advice.reason}</p>
      {advice.fallbackNote && (
        <p className="mt-2 text-sm text-champagne-bright">{advice.fallbackNote}</p>
      )}
      <button type="button" onClick={onNext} className="btn-primary mt-5">
        Avanti
      </button>
    </motion.div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function AllenamentoPage() {
  return (
    <Suspense fallback={<LoadingMark />}>
      <DrillGate />
    </Suspense>
  );
}

function DrillGate() {
  const params = useSearchParams();
  const key = `${params.get("mode") ?? ""}-${params.get("kind") ?? ""}`;
  return <DrillInner key={key} />;
}
