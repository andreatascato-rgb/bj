"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PRESETS, type HoleCardRule, type TableRules } from "@/engine/types";
import { saveRules, setOnboarded } from "@/lib/storage";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [hole, setHole] = useState<HoleCardRule>("enhc");
  const reduce = useReducedMotion();

  function finish(preset: "saintVincent" | "usa" | "custom") {
    let rules: TableRules =
      preset === "usa"
        ? { ...PRESETS.usa.rules }
        : { ...PRESETS.saintVincent.rules };
    if (preset === "custom") {
      rules = { ...PRESETS.saintVincent.rules, holeCard: hole };
    }
    if (preset === "saintVincent") rules.holeCard = "enhc";
    if (preset === "usa") rules.holeCard = "peek";
    saveRules(rules);
    setOnboarded();
    window.dispatchEvent(new Event("mano:onboarded"));
    onDone();
  }

  const stepMotion = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.28 },
      };

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 pt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= step ? "bg-champagne" : "bg-ivory/15"
            }`}
          />
        ))}
      </div>

      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne-bright">
        Passo {step + 1} di 3
      </p>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" {...stepMotion} className="mt-4 flex flex-1 flex-col">
            <h1 className="font-display text-[4.25rem] leading-none tracking-tight text-ivory">
              MANO
            </h1>
            <p className="mt-5 max-w-[22rem] text-lg leading-relaxed text-mist">
              Ti insegna la basic strategy — cosa fare con le tue carte contro il
              banco — finché non ti serve più.
            </p>

            <div className="surface mt-8 space-y-3 rounded-2xl p-4">
              <Row title="Impara" text="Drill e warm-up sulle ~150 situazioni" />
              <Row title="Consulta" text="Risposta rapida in modalità Tavolo" />
              <Row title="Gratis" text="Niente account. Tutto resta sul telefono" />
            </div>

            <button type="button" onClick={() => setStep(1)} className="btn-primary mt-auto">
              Inizia — 30 secondi
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" {...stepMotion} className="mt-4 flex flex-1 flex-col">
            <h2 className="font-display text-3xl leading-tight text-ivory">
              Come distribuisce il banco?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-mist">
              Cambia mosse importanti. Nei casinò italiani di solito la seconda
              carta arriva <span className="font-semibold text-champagne-bright">dopo</span> i
              giocatori.
            </p>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setHole("enhc");
                  setStep(2);
                }}
                className={`choice-card ${hole === "enhc" ? "choice-card-active" : ""}`}
              >
                <span className="block font-display text-xl text-champagne-bright">
                  Dopo i giocatori
                </span>
                <span className="mt-1 block text-sm text-mist">
                  ENHC · tipico Italia / Europa · consigliato
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setHole("peek");
                  setStep(2);
                }}
                className="choice-card"
              >
                <span className="block font-display text-xl text-ivory">
                  Subito (controlla blackjack)
                </span>
                <span className="mt-1 block text-sm text-mist">
                  Peek · tipico tavoli USA
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(0)}
              className="mt-auto pt-8 text-sm text-mist underline-offset-4 hover:text-ivory hover:underline"
            >
              Indietro
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" {...stepMotion} className="mt-4 flex flex-1 flex-col">
            <h2 className="font-display text-3xl leading-tight text-ivory">
              Conferma il tuo tavolo
            </h2>
            <p className="mt-3 text-base text-mist">
              Potrai cambiare tutto in Regole in qualsiasi momento.
            </p>

            <div className="surface mt-8 rounded-2xl p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-bright">
                Preset pronto
              </p>
              <p className="mt-2 font-display text-2xl text-ivory">
                {hole === "peek" ? PRESETS.usa.name : PRESETS.saintVincent.name}
              </p>
              <p className="mt-2 text-sm text-mist">
                {hole === "peek"
                  ? PRESETS.usa.description
                  : PRESETS.saintVincent.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => finish(hole === "peek" ? "usa" : "saintVincent")}
              className="btn-primary mt-6"
            >
              Entra in Studio
            </button>
            <button type="button" onClick={() => finish("custom")} className="btn-secondary mt-3">
              Salva e regola dopo
            </button>

            <p className="mt-6 text-center text-xs leading-relaxed text-mist/80">
              Al casinò il telefono può essere vietato: usa Studio per imparare,
              Tavolo solo se consentito.
            </p>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-4 text-sm text-mist underline-offset-4 hover:text-ivory hover:underline"
            >
              Indietro
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Row({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-champagne shadow-[0_0_12px_rgba(224,184,106,0.55)]" />
      <div>
        <p className="text-base font-semibold text-ivory">{title}</p>
        <p className="mt-0.5 text-[15px] leading-snug text-mist">{text}</p>
      </div>
    </div>
  );
}
