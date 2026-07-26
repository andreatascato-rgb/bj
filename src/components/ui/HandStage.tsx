"use client";

import type { Rank } from "@/engine";
import { PlayingCard } from "@/components/ui/RankPicker";

/** Shared Banco / Tu card stage — same rhythm in Tavolo and Allena. */
export function HandStage({
  dealer,
  playerCards,
  playerHandLabel,
}: {
  dealer: Rank | null;
  playerCards: Rank[];
  /** Shown under player cards when present */
  playerHandLabel?: string | null;
}) {
  return (
    <div className="mt-8 flex items-start justify-center gap-5">
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

      <div
        className="mt-[1.65rem] h-[4.5rem] w-px shrink-0 bg-champagne/30"
        aria-hidden
      />

      <div className="text-center">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-mist">
          Tu
        </p>
        <div className="flex justify-center gap-2">
          {playerCards.length === 0 ? (
            <PlayingCard rank={null} />
          ) : (
            playerCards.map((c, i) => (
              <PlayingCard key={`${c}-${i}`} rank={c} delay={i * 0.05} />
            ))
          )}
        </div>
        {playerHandLabel ? (
          <p className="mt-2 text-xs font-medium text-champagne-bright">
            {playerHandLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
