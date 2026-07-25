"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { masteryScore } from "@/learning/sm2";
import { useIsClient, useMemory, useOnboarded, useRules } from "@/lib/client";
import { rulesLabel } from "@/engine";
import { Onboarding } from "@/components/studio/Onboarding";
import { LoadingMark, PageEnter } from "@/components/ui/PageChrome";

export default function StudioHome() {
  const isClient = useIsClient();
  const onboarded = useOnboarded();
  const memory = useMemory();
  const rules = useRules();
  const [forceOnboard, setForceOnboard] = useState(false);

  if (!isClient) return <LoadingMark />;

  const showOnboard = forceOnboard || !onboarded;
  if (showOnboard) {
    return (
      <Onboarding
        onDone={() => {
          setForceOnboard(false);
        }}
      />
    );
  }

  const { percent: mastery, weak, due } = masteryScore(memory);

  const nextHref =
    mastery < 15 ? "/allenamento/?kind=hard" : "/allenamento/?mode=warmup";
  const nextLabel =
    mastery < 15
      ? "Inizia dagli Hard"
      : weak > 0
        ? `Warm-up · ${weak} da ripassare`
        : due > 40
          ? "Warm-up · celle in scadenza"
          : "Warm-up 5 minuti";
  const nextHint =
    mastery < 15
      ? "Parti dai totali hard: sono i più frequenti al tavolo."
      : weak > 0
        ? "Ripassa le celle che hai sbagliato di recente."
        : mastery >= 80
          ? "Mantieni la memoria con un warm-up breve prima del casinò."
          : "Allena i punti deboli per salire di mastery.";

  return (
    <PageEnter>
      <header className="pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne-bright">
          Studio
        </p>
        <h1 className="mt-3 font-display text-6xl font-semibold tracking-tight text-ivory sm:text-7xl">
          MANO
        </h1>
        <p className="mt-4 max-w-sm text-lg leading-relaxed text-mist">
          Impara le mosse giuste. Poi lascia l&apos;app a casa.
        </p>
        <Link
          href="/regole/"
          className="mt-4 inline-flex rounded-full border border-champagne/30 bg-felt-deep/40 px-3 py-1 text-[11px] font-semibold tracking-wide text-champagne-bright no-underline"
        >
          {rulesLabel(rules)}
        </Link>
      </header>

      <section className="surface mt-8 rounded-3xl p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-bright">
              Mastery
            </p>
            <p className="mt-1 font-display text-5xl text-champagne-bright">
              {mastery}%
            </p>
          </div>
          <p className="max-w-[11rem] text-right text-sm leading-snug text-mist">
            {mastery >= 80 ? "Pronto a giocare senza consultare." : nextHint}
          </p>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-felt-card/80">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-champagne to-champagne-bright"
            initial={{ width: 0 }}
            animate={{ width: `${mastery}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-mist">
          {weak > 0 && (
            <span className="rounded-full bg-danger/15 px-2.5 py-1 text-danger">
              {weak} deboli
            </span>
          )}
          <span className="rounded-full bg-ivory/8 px-2.5 py-1">
            ~{Math.min(due, 99)} da ripassare
          </span>
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-3">
        <Link href={nextHref} className="btn-primary no-underline">
          {nextLabel}
        </Link>
        <Link href="/allenamento/" className="btn-secondary no-underline">
          Allenamento completo
        </Link>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Link
            href="/allenamento/?kind=hard"
            className="rounded-xl border border-ivory/12 bg-felt-deep/35 py-2.5 text-center text-xs font-semibold text-mist no-underline"
          >
            Hard
          </Link>
          <Link
            href="/allenamento/?kind=soft"
            className="rounded-xl border border-ivory/12 bg-felt-deep/35 py-2.5 text-center text-xs font-semibold text-mist no-underline"
          >
            Soft
          </Link>
          <Link
            href="/allenamento/?kind=pair"
            className="rounded-xl border border-ivory/12 bg-felt-deep/35 py-2.5 text-center text-xs font-semibold text-mist no-underline"
          >
            Coppie
          </Link>
        </div>
        <div className="flex items-center justify-center gap-4 pt-1 text-sm">
          <Link
            href="/tabella/"
            className="text-mist no-underline hover:text-ivory"
          >
            Tabella
          </Link>
          <span className="text-ivory/20">·</span>
          <Link
            href="/tavolo/"
            className="text-mist no-underline hover:text-ivory"
          >
            Tavolo →
          </Link>
        </div>
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-mist">
        Educativo · verifica le regole del tavolo · €0
      </p>
    </PageEnter>
  );
}
