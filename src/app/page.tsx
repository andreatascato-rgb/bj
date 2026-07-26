"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  countByKind,
  masteryScore,
  weakFocusCells,
} from "@/learning/sm2";
import {
  useInstallHintDismissed,
  useIsClient,
  useMemory,
  useOnboarded,
  useRules,
  useStats,
} from "@/lib/client";
import { dismissInstallHint } from "@/lib/storage";
import {
  isStandalone,
  promptInstall,
  useCanInstall,
} from "@/components/ui/PwaChrome";
import { rulesLabel } from "@/engine";
import { Onboarding } from "@/components/studio/Onboarding";
import { LoadingMark, PageEnter } from "@/components/ui/PageChrome";
import { RulesChip } from "@/components/ui/PageHeader";

export default function StudioHome() {
  const isClient = useIsClient();
  const onboarded = useOnboarded();
  const memory = useMemory();
  const rules = useRules();
  const stats = useStats();
  const installDismissed = useInstallHintDismissed();
  const canInstall = useCanInstall();
  const reduceMotion = useReducedMotion();
  const [forceOnboard, setForceOnboard] = useState(false);
  const [installBusy, setInstallBusy] = useState(false);

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

  const { percent: mastery, weak, due, solid, learning } = masteryScore(memory);
  const focus = weakFocusCells(memory, 3);
  const hard = countByKind(memory, "hard");
  const soft = countByKind(memory, "soft");
  const pair = countByKind(memory, "pair");
  const ready = mastery >= 80;

  const nextHref =
    mastery < 15 ? "/allenamento/?kind=hard" : "/allenamento/?mode=warmup";
  const nextLabel = ready
    ? "Mantieni · warm-up"
    : mastery < 15
      ? "Inizia dagli Hard"
      : weak > 0
        ? `Warm-up · ${weak} da ripassare`
        : due > 40
          ? "Warm-up · celle in scadenza"
          : "Warm-up 5 minuti";

  const showInstall = !installDismissed && !isStandalone();

  return (
    <PageEnter>
      {/* First viewport: brand + mastery + one CTA */}
      <header className="pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne-bright">
          Studio
        </p>
        <h1 className="mt-3 font-display text-6xl font-semibold tracking-tight text-ivory sm:text-7xl">
          MANO
        </h1>
        <p className="mt-4 max-w-sm text-lg leading-relaxed text-mist">
          {ready
            ? "Pronto: puoi lasciare l’app a casa. Mantieni con warm-up brevi."
            : "Impara le mosse giuste. Poi lascia l’app a casa."}
        </p>
        <div className="mt-4">
          <RulesChip label={rulesLabel(rules)} />
        </div>
      </header>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-bright">
              Mastery
            </p>
            <p className="mt-1 font-display text-5xl text-champagne-bright">
              {mastery}%
            </p>
          </div>
          {ready && (
            <p className="rounded-full border border-ok/35 bg-ok/10 px-3 py-1 text-xs font-semibold text-ok">
              Pronto
            </p>
          )}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-felt-card/80">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-champagne to-champagne-bright"
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${mastery}%` }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }
            }
          />
        </div>
        <Link href={nextHref} className="btn-primary mt-6 no-underline">
          {nextLabel}
        </Link>
      </section>

      {/* Below fold */}
      <section className="surface mt-10 rounded-3xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-bright">
          Per tipo
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
          {(
            [
              ["Hard", hard, "/allenamento/?kind=hard"],
              ["Soft", soft, "/allenamento/?kind=soft"],
              ["Coppie", pair, "/allenamento/?kind=pair"],
            ] as const
          ).map(([label, k, href]) => (
            <Link
              key={label}
              href={href}
              className="rounded-xl border border-ivory/10 bg-felt-deep/40 px-2.5 py-2.5 no-underline"
            >
              <span className="block font-semibold text-mist">{label}</span>
              <span className="mt-0.5 block font-display text-lg text-champagne-bright">
                {k.percent}%
              </span>
              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-felt-card/80">
                <span
                  className="block h-full rounded-full bg-champagne/80"
                  style={{ width: `${k.percent}%` }}
                />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-mist">
          {solid > 0 && <span>{solid} solide</span>}
          {learning > 0 && <span>{learning} in corso</span>}
          {weak > 0 && <span className="text-danger">{weak} deboli</span>}
          <span>~{Math.min(due, 99)} da ripassare</span>
          {stats.sessions > 0 && (
            <span>
              {stats.sessions} sessioni
              {stats.lastAccuracy != null
                ? ` · ultima ${stats.lastAccuracy}%`
                : ""}
              {stats.bestStreak > 1 ? ` · streak ${stats.bestStreak}` : ""}
            </span>
          )}
        </div>
      </section>

      {focus.length > 0 && (
        <section className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-bright">
            Focus oggi
          </p>
          <ul className="mt-3 space-y-2">
            {focus.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/allenamento/?cell=${encodeURIComponent(c.id)}`}
                  className="flex min-h-11 items-center justify-between rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 no-underline"
                >
                  <span className="font-display text-lg text-ivory">
                    {c.label}
                  </span>
                  <span className="text-xs font-semibold text-danger">
                    Allena →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Link href="/allenamento/" className="btn-secondary no-underline">
          Allenamento completo
        </Link>
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

      {showInstall && (
        <div className="surface mt-8 rounded-2xl p-4">
          <p className="text-sm leading-relaxed text-mist">
            {canInstall
              ? "Installa MANO sulla Home: apre come app, anche offline."
              : "Sul telefono: menu del browser → Aggiungi alla schermata Home. Funziona offline, senza store."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {canInstall && (
              <button
                type="button"
                disabled={installBusy}
                onClick={async () => {
                  setInstallBusy(true);
                  const outcome = await promptInstall();
                  setInstallBusy(false);
                  if (outcome === "accepted") dismissInstallHint();
                }}
                className="min-h-11 rounded-xl bg-champagne px-4 py-2.5 text-sm font-semibold text-felt-deep disabled:opacity-60"
              >
                Installa
              </button>
            )}
            <button
              type="button"
              onClick={() => dismissInstallHint()}
              className="min-h-11 px-2 text-sm font-semibold text-mist underline-offset-4 hover:text-ivory hover:underline"
            >
              Nascondi
            </button>
          </div>
        </div>
      )}

      <p className="mt-auto pt-10 text-center text-xs text-mist">
        Educativo · verifica le regole del tavolo · €0
      </p>
    </PageEnter>
  );
}
