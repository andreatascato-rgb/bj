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
          return (
            <motion.button
              key={r.label}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                haptic();
                onSelect(r.value);
              }}
              className={`min-h-14 rounded-xl border font-display text-xl font-semibold transition ${
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
      className="flex h-28 w-[4.5rem] items-center justify-center rounded-2xl border border-champagne/25 bg-[linear-gradient(145deg,#145a44_0%,#041611_55%,#0c3d2f_100%)] shadow-xl"
      aria-hidden
    >
      <div className="h-16 w-11 rounded-lg border border-champagne/35" />
    </div>
  ) : rank == null ? (
    <div className="flex h-28 w-[4.5rem] items-center justify-center rounded-2xl border border-dashed border-ivory/25 bg-felt-deep/35 text-mist">
      <span className="font-display text-2xl opacity-50">?</span>
    </div>
  ) : (
    <div className="relative flex h-28 w-[4.5rem] flex-col justify-between rounded-2xl border border-black/10 bg-gradient-to-br from-[#fffaf2] to-[#efe2cf] p-2.5 text-felt-deep shadow-[0_14px_30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl font-semibold">{label}</span>
        <span
          className={`mt-0.5 text-sm ${red ? "text-[#9b2c2c]" : "text-felt-deep"}`}
          aria-hidden
        >
          {suit}
        </span>
      </div>
      <span
        className={`absolute inset-0 flex items-center justify-center font-display text-4xl opacity-[0.12] ${
          red ? "text-[#9b2c2c]" : ""
        }`}
        aria-hidden
      >
        {suit}
      </span>
      <div className="flex rotate-180 flex-col leading-none self-end">
        <span className="font-display text-xl font-semibold">{label}</span>
        <span
          className={`mt-0.5 text-sm ${red ? "text-[#9b2c2c]" : "text-felt-deep"}`}
          aria-hidden
        >
          {suit}
        </span>
      </div>
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
