"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DEALER_COLS,
  cellId,
  getAdvice,
  rulesLabel,
  synthesizeHard,
  synthesizeSoft,
  type Action,
  type DealerUp,
  type Rank,
} from "@/engine";
import { cellDisplayLabel } from "@/learning/sm2";
import { useIsClient, useMemory, useRules } from "@/lib/client";
import { LoadingMark, PageEnter } from "@/components/ui/PageChrome";

type Tab = "hard" | "soft" | "pair";

const ACTION_SHORT: Record<Action, string> = {
  hit: "H",
  stand: "S",
  double: "D",
  split: "P",
  surrender: "R",
  insurance_no: "N",
  insurance_yes: "Y",
};

export default function TabellaPage() {
  const isClient = useIsClient();
  const rules = useRules();
  const mem = useMemory();
  const [tab, setTab] = useState<Tab>("hard");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (tab === "hard") return Array.from({ length: 10 }, (_, i) => 8 + i);
    if (tab === "soft") return Array.from({ length: 8 }, (_, i) => 13 + i);
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }, [tab]);

  if (!isClient) return <LoadingMark />;

  function cellCards(row: number): Rank[] {
    if (tab === "hard") return synthesizeHard(row);
    if (tab === "soft") return synthesizeSoft(row);
    const r = row as Rank;
    return [r, r];
  }

  function rowLabel(row: number): string {
    if (tab === "pair") return row === 1 ? "A,A" : `${row},${row}`;
    if (tab === "soft") return `A${row - 11}`;
    return String(row);
  }

  function makeId(row: number, d: DealerUp): string {
    if (tab === "pair") {
      const pk = row === 1 ? "A" : String(row);
      return cellId("pair", pk, d);
    }
    return cellId(tab, String(row), d);
  }

  const selectedAdvice = selectedId
    ? (() => {
        const parts = selectedId.split(":");
        const kind = parts[0] as Tab;
        const player = parts[1];
        const dealer = Number(parts[2]) as DealerUp;
        let cards: Rank[];
        if (kind === "pair") {
          const r = (player === "A" ? 1 : Number(player)) as Rank;
          cards = [r, r];
        } else if (kind === "soft") {
          cards = synthesizeSoft(Number(player));
        } else {
          cards = synthesizeHard(Number(player));
        }
        return getAdvice(cards, dealer, rules);
      })()
    : null;

  return (
    <PageEnter>
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne-bright">
          Riferimento
        </p>
        <h1 className="mt-2 font-display text-4xl text-ivory">Tabella</h1>
        <p className="mt-2 text-sm text-mist">
          Tocca una cella per il perché. Colori = la tua memoria.
        </p>
        <p className="mt-2 text-[11px] font-semibold tracking-wide text-champagne-bright">
          {rulesLabel(rules)}
        </p>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(["hard", "soft", "pair"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setSelectedId(null);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              tab === t
                ? "bg-champagne text-felt-deep"
                : "bg-felt-card/60 text-mist"
            }`}
          >
            {t === "hard" ? "Hard" : t === "soft" ? "Soft" : "Coppie"}
          </button>
        ))}
        <Link
          href={`/allenamento/?kind=${tab}`}
          className="ml-auto rounded-full border border-champagne/35 px-3.5 py-1.5 text-xs font-semibold text-champagne-bright no-underline"
        >
          Allena {tab === "hard" ? "Hard" : tab === "soft" ? "Soft" : "Coppie"}
        </Link>
      </div>

      <div className="surface mt-5 overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[320px] border-collapse text-center text-[11px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#062419]/90 p-2.5 text-mist backdrop-blur-sm">
                 
              </th>
              {DEALER_COLS.map((d) => (
                <th
                  key={d}
                  className="p-2.5 font-semibold text-champagne-bright"
                >
                  {d === 1 ? "A" : d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-t border-felt-line/40">
                <th className="sticky left-0 z-10 bg-[#062419]/80 p-2 text-left font-semibold text-mist backdrop-blur-sm">
                  {rowLabel(row)}
                </th>
                {DEALER_COLS.map((d) => {
                  const cards = cellCards(row);
                  const advice = getAdvice(cards, d as DealerUp, rules);
                  const id = makeId(row, d as DealerUp);
                  const m = mem[id];
                  const weak = m?.lastResult === "again";
                  const solid = m && m.repetitions >= 2;
                  const active = selectedId === id;
                  return (
                    <td key={d} className="p-0.5">
                      <button
                        type="button"
                        onClick={() => setSelectedId(id)}
                        className={`flex h-9 w-full items-center justify-center rounded-md font-semibold ${
                          active
                            ? "ring-1 ring-champagne"
                            : ""
                        } ${
                          weak
                            ? "bg-danger/25 text-danger"
                            : solid
                              ? "bg-ok/20 text-ok"
                              : "bg-felt-deep/35 text-ivory"
                        }`}
                      >
                        {advice ? ACTION_SHORT[advice.action] : "—"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-mist">
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-ok/40" /> Solida
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-danger/40" /> Da ripassare
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-felt-deep/60" /> Neutra
        </span>
      </div>

      {selectedId && selectedAdvice && (
        <div className="surface mt-4 rounded-2xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-bright">
            {cellDisplayLabel(selectedId)}
          </p>
          <p className="mt-2 font-display text-3xl text-champagne-bright">
            {selectedAdvice.label}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-mist">
            {selectedAdvice.reason}
          </p>
          {selectedAdvice.fallbackNote && (
            <p className="mt-2 text-sm text-champagne-bright">
              {selectedAdvice.fallbackNote}
            </p>
          )}
          <Link
            href={`/allenamento/?cell=${encodeURIComponent(selectedId)}`}
            className="btn-primary mt-4 no-underline"
          >
            Allena questa situazione
          </Link>
        </div>
      )}
    </PageEnter>
  );
}
