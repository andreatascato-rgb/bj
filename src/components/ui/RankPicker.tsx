"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Rank } from "@/engine/types";
import { dealCard } from "@/lib/motion";

const RANKS: { value: Rank; label: string }[] = [
  { value: 1, label: "A" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
  { value: 6, label: "6" },
  { value: 7, label: "7" },
  { value: 8, label: "8" },
  { value: 9, label: "9" },
  { value: 10, label: "10" },
];

const SUITS = ["♠", "♥", "♦", "♣"] as const;

/** Decorative suit only — not used for strategy. */
export function suitForRank(rank: Rank): (typeof SUITS)[number] {
  return SUITS[(rank - 1) % 4];
}

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(8);
  }
}

function keyToRank(key: string): Rank | null {
  const k = key.toLowerCase();
  if (k === "a") return 1;
  if (k === "0" || k === "t") return 10;
  const n = Number(k);
  if (n >= 2 && n <= 9) return n as Rank;
  return null;
}

interface Props {
  label: string;
  value: Rank | null;
  onSelect: (r: Rank) => void;
  /** When true, listen for keyboard shortcuts. */
  keyboard?: boolean;
}

export function RankPicker({ label, value, onSelect, keyboard = true }: Props) {
  useEffect(() => {
    if (!keyboard) return;
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
      const rank = keyToRank(e.key);
      if (rank == null) return;
      e.preventDefault();
      haptic();
      onSelect(rank);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboard, onSelect]);

  return (
    <div className="w-full">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-champagne-bright">
        {label}
      </p>
      <div className="grid grid-cols-5 gap-2">
        {RANKS.map((r) => {
          const active = value === r.value;
          const isTen = r.value === 10;
          return (
            <motion.button
              key={r.label}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                haptic();
                onSelect(r.value);
              }}
              className={`flex min-h-14 items-center justify-center rounded-2xl border font-display font-semibold tabular-nums transition ${
                isTen ? "text-[1.05rem] tracking-tight" : "text-xl"
              } ${
                active
                  ? "border-champagne bg-champagne text-felt-deep shadow-[0_8px_24px_rgba(224,184,106,0.35)]"
                  : "border-ivory/15 bg-felt-deep/50 text-ivory"
              }`}
            >
              {r.label}
            </motion.button>
          );
        })}
      </div>
      {keyboard && (
        <p className="mt-2 text-center text-[10px] text-mist/60">
          Tasti A · 2–9 · 0/T
        </p>
      )}
    </div>
  );
}

function CardCorner({
  label,
  suit,
  red,
}: {
  label: string;
  suit: string;
  red: boolean;
}) {
  const isTen = label === "10";
  return (
    <div
      className={`flex w-[1.15rem] flex-col items-center leading-none ${
        red ? "text-[#b42318]" : "text-[#1a1a1a]"
      }`}
    >
      <span
        className={`font-display font-semibold tracking-tight ${
          isTen ? "text-[0.95rem]" : "text-[1.15rem]"
        }`}
      >
        {label}
      </span>
      <span className="mt-[1px] text-[0.72rem] leading-none" aria-hidden>
        {suit}
      </span>
    </div>
  );
}

export function PlayingCard({
  rank,
  faceDown,
  delay = 0,
}: {
  rank?: Rank | null;
  faceDown?: boolean;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const label =
    rank == null ? "?" : rank === 1 ? "A" : rank === 10 ? "10" : String(rank);
  const suit = rank != null ? suitForRank(rank) : null;
  const red = suit === "♥" || suit === "♦";

  const inner = faceDown ? (
    <div
      className="flex h-[7.25rem] w-[5.1rem] items-center justify-center rounded-[0.85rem] border border-champagne/25 bg-[linear-gradient(145deg,#145a44_0%,#041611_55%,#0c3d2f_100%)] shadow-xl"
      aria-hidden
    >
      <div className="h-[4.25rem] w-[2.85rem] rounded-md border border-champagne/35" />
    </div>
  ) : rank == null ? (
    <div className="flex h-[7.25rem] w-[5.1rem] items-center justify-center rounded-[0.85rem] border border-dashed border-ivory/25 bg-felt-deep/35 text-mist">
      <span className="font-display text-2xl opacity-50">?</span>
    </div>
  ) : (
    <div
      className="relative h-[7.25rem] w-[5.1rem] overflow-hidden rounded-[0.85rem] border border-black/12 bg-gradient-to-br from-[#fffdf8] via-[#f7efe3] to-[#ebddc8] text-[#1a1a1a] shadow-[0_12px_28px_rgba(0,0,0,0.38)]"
      aria-label={`${label} ${suit}`}
    >
      {/* Top-left index — classic corner stack */}
      <div className="absolute top-[0.35rem] left-[0.28rem] z-10">
        <CardCorner label={label} suit={suit!} red={red} />
      </div>

      {/* Bottom-right index — true 180° mirror of the same corner */}
      <div className="absolute right-[0.28rem] bottom-[0.35rem] z-10 rotate-180">
        <CardCorner label={label} suit={suit!} red={red} />
      </div>

      {/* Single centered pip watermark */}
      <span
        className={`pointer-events-none absolute inset-0 flex items-center justify-center text-[2.65rem] leading-none opacity-[0.18] ${
          red ? "text-[#b42318]" : "text-[#1a1a1a]"
        }`}
        aria-hidden
      >
        {suit}
      </span>
    </div>
  );

  if (reduce || rank == null) return inner;

  return (
    <motion.div
      key={String(rank) + delay}
      initial={dealCard.initial}
      animate={dealCard.animate}
      transition={{ ...dealCard.transition, delay }}
    >
      {inner}
    </motion.div>
  );
}
