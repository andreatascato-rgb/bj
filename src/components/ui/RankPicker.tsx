"use client";

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

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(8);
  }
}

interface Props {
  label: string;
  value: Rank | null;
  onSelect: (r: Rank) => void;
  compact?: boolean;
}

export function RankPicker({ label, value, onSelect }: Props) {
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
      <span className="font-display text-xl font-semibold leading-none">
        {label}
      </span>
      <span className="absolute inset-0 flex items-center justify-center font-display text-3xl opacity-[0.08]">
        {label}
      </span>
      <span className="self-end font-display text-xl font-semibold leading-none rotate-180">
        {label}
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
