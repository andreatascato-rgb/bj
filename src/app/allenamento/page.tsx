"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ACTION_LABELS,
  allDrillCells,
  getAdvice,
  handLabel,
  type Action,
  type Advice,
} from "@/engine";
import {
  cellDisplayLabel,
  isDue,
  masteryScore,
  review,
} from "@/learning/sm2";
import { useAutoAdvance, useIsClient, useRules } from "@/lib/client";
import {
  getOrCreateMemory,
  loadMemory,
  recordSession,
  upsertMemory,
} from "@/lib/storage";
import { feedback } from "@/lib/feedback";
import { SegmentedControl } from "@/components/ui/FancySelect";
import { LoadingMark, PageEnter } from "@/components/ui/PageChrome";
import { PageHeader } from "@/components/ui/PageHeader";
import { HandStage } from "@/components/ui/HandStage";

const CHOICES: Action[] = ["hit", "stand", "double", "split", "surrender"];

/** Enough to read “Corretto” + one-line reason before the next hand. */
const AUTO_ADVANCE_MS = 1600;

const KEY_TO_ACTION: Record<string, Action> = {
  "1": "hit",
  "2": "stand",
  "3": "double",
  "4": "split",
  "5": "surrender",
  h: "hit",
  s: "stand",
  d: "double",
  p: "split",
  r: "surrender",
};

function buildQueue(
  warmup: boolean,
  kindFilter: "hard" | "soft" | "pair" | undefined,
  cellId: string | null,
) {
  const cells = allDrillCells(kindFilter);
  const mem = loadMemory();
  const masteryStart = masteryScore(mem).percent;

  if (cellId) {
    const target =
      cells.find((c) => c.id === cellId) ??
      allDrillCells().find((c) => c.id === cellId);
    if (target) {
      const reps = 4;
      return {
        queue: Array.from({ length: reps }, () => target),
        masteryStart,
        focused: true as const,
      };
    }
  }

  const due = cells.filter((c) => isDue(mem[c.id]));
  const weak = cells.filter((c) => mem[c.id]?.lastResult === "again");
  const learning = cells.filter((c) => {
    const m = mem[c.id];
    return m && m.repetitions > 0 && m.lastResult !== "again";
  });
  const fresh = cells.filter((c) => !mem[c.id]);
  const size = warmup ? 20 : kindFilter ? 30 : 40;

  let pool: typeof cells;
  if (warmup) {
    pool = fillUnique(weak, [...due, ...learning, ...fresh, ...cells], size);
  } else {
    pool = fillUnique(due, [...learning, ...fresh, ...cells], size);
  }

  return {
    queue: pool.length ? pool : cells.slice(0, 1),
    masteryStart,
    focused: false as const,
  };
}

function fillUnique<T extends { id: string }>(
  primary: T[],
  secondary: T[],
  size: number,
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const list of [shuffle(primary), shuffle(secondary)]) {
    for (const item of list) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      if (out.length >= size) return out;
    }
  }
  return out;
}

function DrillInner() {
  const params = useSearchParams();
  const warmup = params.get("mode") === "warmup";
  const kindParam = params.get("kind");
  const cellParam = params.get("cell");
  const kindFilter =
    kindParam === "hard" || kindParam === "soft" || kindParam === "pair"
      ? kindParam
      : undefined;

  const isClient = useIsClient();
  const rules = useRules();
  const autoAdvancePref = useAutoAdvance();
  const reduceMotion = useReducedMotion();
  const [sessionKey, setSessionKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Action | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAsked, setTotalAsked] = useState(0);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const recorded = useRef(false);

  const session = useMemo(() => {
    if (!isClient) return null;
    void sessionKey;
    return buildQueue(warmup, kindFilter, cellParam);
  }, [isClient, warmup, kindFilter, cellParam, sessionKey]);

  const queue = session?.queue ?? [];
  const masteryStart = session?.masteryStart ?? 0;
  const focused = session?.focused ?? false;

  function rebuild() {
    recorded.current = false;
    setSessionKey((k) => k + 1);
    setIndex(0);
    setPicked(null);
    setCorrectCount(0);
    setTotalAsked(0);
    setDone(false);
    setStreak(0);
    setBestStreak(0);
    setMissed([]);
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

  const answer = useCallback(
    (a: Action) => {
      if (!current || !advice || picked) return;
      const ok = a === advice.action;
      setPicked(a);
      setTotalAsked((t) => t + 1);
      if (ok) {
        setCorrectCount((c) => c + 1);
        setStreak((s) => {
          const n = s + 1;
          setBestStreak((b) => Math.max(b, n));
          return n;
        });
      } else {
        setStreak(0);
        setMissed((m) =>
          m.includes(current.id) ? m : [...m, current.id].slice(0, 4),
        );
      }
      const mem = getOrCreateMemory(current.id);
      upsertMemory(current.id, review(mem, ok));
      feedback(ok ? "correct" : "wrong");
    },
    [current, advice, picked],
  );

  const visibleChoices = CHOICES.filter(
    (c) => c !== "surrender" || rules.surrender,
  );

  useEffect(() => {
    if (picked || done || !advice) return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const action = KEY_TO_ACTION[e.key.toLowerCase()];
      if (!action || !visibleChoices.includes(action)) return;
      e.preventDefault();
      answer(action);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked, done, advice, answer, visibleChoices]);

  useEffect(() => {
    if (!done || recorded.current || totalAsked === 0) return;
    recorded.current = true;
    const pct = Math.round((correctCount / totalAsked) * 100);
    recordSession(pct, bestStreak);
  }, [done, totalAsked, correctCount, bestStreak]);

  // Auto-advance + Invio/Spazio vivono in Feedback (un solo passaggio, no doppio skip).

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
          {focused
            ? "Cella ripassata"
            : warmup
              ? "Warm-up finito"
              : "Sessione finita"}
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
        {bestStreak > 1 && (
          <p className="mt-1 text-sm text-champagne-bright">
            Streak migliore: {bestStreak}
          </p>
        )}
        <p className="mt-2 max-w-xs text-sm text-mist">
          {warmup
            ? "Sei più caldo. Se vai al casinò, ripassa solo i dubbi a mente."
            : "Continua così: la memoria si solidifica con ripetizioni brevi."}
        </p>

        {missed.length > 0 && (
          <div className="mt-6 w-full max-w-xs text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-danger">
              Da ripassare
            </p>
            <ul className="mt-2 space-y-1.5">
              {missed.slice(0, 2).map((id) => (
                <li key={id}>
                  <Link
                    href={`/allenamento/?cell=${encodeURIComponent(id)}`}
                    className="block rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-ivory no-underline"
                  >
                    {cellDisplayLabel(id)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button type="button" onClick={rebuild} className="btn-primary">
            Ancora questa sessione
          </button>
          {nextKind && !focused && (
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
  const progress =
    ((index + (revealed ? 1 : 0)) / Math.max(queue.length, 1)) * 100;
  const title = focused
    ? "Focus"
    : warmup
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
      <PageHeader
        size="session"
        eyebrow={title}
        title={
          <>
            {index + 1}
            <span className="text-mist">/{queue.length}</span>
          </>
        }
        actions={
          <Link href="/" className="ghost-btn no-underline">
            Esci
          </Link>
        }
      />
      <div className="mt-3 flex items-center justify-between text-sm text-mist">
        <span>
          {correctCount} ok
          {streak > 1 ? ` · streak ${streak}` : ""}
        </span>
        <span>~{Math.max(1, queue.length - index)} rimaste</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-felt-card/70">
        <motion.div
          className="h-full rounded-full bg-champagne"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.25 }}
        />
      </div>
      {!warmup && !focused && (
        <div className="mt-4">
          <KindFilter value={kindFilter ?? ""} />
        </div>
      )}

      <HandStage
        dealer={current.dealerUp}
        playerCards={current.cards}
        playerHandLabel={handLabel(current.cards)}
      />

      <p className="mt-7 text-center text-sm font-medium text-mist">
        Cosa fai in questa mano?
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {visibleChoices.map((c, i) => {
          const isRight = revealed && c === advice.action;
          const isWrong = revealed && c === picked && !ok;
          const alone =
            visibleChoices.length % 2 === 1 &&
            i === visibleChoices.length - 1;
          return (
            <motion.button
              key={c}
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              disabled={revealed}
              onClick={() => answer(c)}
              className={`flex min-h-[3.5rem] items-center justify-center rounded-2xl border px-3 py-3.5 text-[15px] font-semibold transition ${
                alone ? "col-span-2" : ""
              } ${
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
        })}
      </div>

      {revealed && (
        <Feedback
          advice={advice}
          picked={picked!}
          ok={ok}
          onNext={next}
          autoAdvancing={ok && autoAdvancePref && !reduceMotion}
        />
      )}
    </PageEnter>
  );
}

function Feedback({
  advice,
  picked,
  ok,
  onNext,
  autoAdvancing,
}: {
  advice: Advice;
  picked: Action;
  ok: boolean;
  onNext: () => void;
  autoAdvancing: boolean;
}) {
  const advanced = useRef(false);

  const go = useCallback(() => {
    if (advanced.current) return;
    advanced.current = true;
    feedback("advance");
    onNext();
  }, [onNext]);

  useEffect(() => {
    if (!autoAdvancing) return;
    const t = window.setTimeout(go, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [autoAdvancing, go]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
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
      go();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface mt-6 overflow-hidden rounded-3xl p-5"
      role="status"
      aria-live="polite"
    >
      <p className={`font-display text-3xl ${ok ? "text-ok" : "text-danger"}`}>
        {ok ? "Corretto" : "Quasi"}
      </p>
      {!ok && (
        <p className="mt-2 text-[15px] font-semibold text-ivory">
          Era{" "}
          <span className="text-ok">{ACTION_LABELS[advice.action]}</span>
          <span className="font-normal text-mist">
            {" "}
            · hai scelto {ACTION_LABELS[picked]}
          </span>
        </p>
      )}
      <p className="mt-2 text-[15px] leading-relaxed text-mist">{advice.reason}</p>
      {advice.fallbackNote && (
        <p className="mt-2 text-sm text-champagne-bright">{advice.fallbackNote}</p>
      )}
      {autoAdvancing ? (
        <div className="mt-5">
          <div className="h-1 overflow-hidden rounded-full bg-felt-card/70">
            <motion.div
              className="h-full rounded-full bg-champagne/80"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: "linear" }}
            />
          </div>
          <button
            type="button"
            onClick={go}
            className="text-link mt-1"
          >
            Avanti subito · Invio
          </button>
        </div>
      ) : (
        <button type="button" onClick={go} className="btn-primary mt-5">
          Avanti · Invio
        </button>
      )}
    </motion.div>
  );
}

function KindFilter({ value }: { value: string }) {
  const router = useRouter();
  return (
    <SegmentedControl
      ariaLabel="Tipo di carte"
      value={value}
      onChange={(v) => {
        router.push(v ? `/allenamento/?kind=${v}` : "/allenamento/");
      }}
      options={[
        { value: "", label: "Tutti" },
        { value: "hard", label: "Hard" },
        { value: "soft", label: "Soft" },
        { value: "pair", label: "Coppie" },
      ]}
    />
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
  const key = `${params.get("mode") ?? ""}-${params.get("kind") ?? ""}-${params.get("cell") ?? ""}`;
  return <DrillInner key={key} />;
}
