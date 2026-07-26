"use client";

import { useState, useSyncExternalStore } from "react";
import {
  PRESETS,
  PRESET_ORDER,
  findMatchingPreset,
  type DoubleRule,
  type HoleCardRule,
  type PresetId,
  type Soft17,
  type TableRules,
} from "@/engine/types";
import { useIsClient, useAutoAdvance, useRules } from "@/lib/client";
import {
  clearProgress,
  downloadBackup,
  importBackup,
  resetOnboarding,
  saveRules,
  setAutoAdvanceEnabled,
} from "@/lib/storage";
import {
  feedback,
  isSoundEnabled,
  setSoundEnabled,
  subscribeSound,
} from "@/lib/feedback";
import { LoadingMark, PageEnter } from "@/components/ui/PageChrome";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  FancySelect,
  SegmentedControl,
} from "@/components/ui/FancySelect";
import { Toggle } from "@/components/ui/Toggle";

type PresetChoice = PresetId | "personalizzato";

function rulesDiffer(a: TableRules, b: TableRules): boolean {
  return (
    a.decks !== b.decks ||
    a.soft17 !== b.soft17 ||
    a.holeCard !== b.holeCard ||
    a.double !== b.double ||
    a.das !== b.das ||
    a.surrender !== b.surrender ||
    a.resplitAces !== b.resplitAces
  );
}

/** Ask before wiping mastery when table rules change. Default yes. */
function confirmResetMastery(): boolean {
  return window.confirm(
    "Le mosse cambiano con queste regole. Azzerare mastery e progresso di studio? (Consigliato)",
  );
}

export default function RegolePage() {
  const isClient = useIsClient();
  const stored = useRules();
  const soundOn = useSyncExternalStore(
    subscribeSound,
    isSoundEnabled,
    () => true,
  );
  const autoAdvance = useAutoAdvance();
  const [choiceOverride, setChoiceOverride] = useState<PresetChoice | null>(
    null,
  );
  const [draft, setDraft] = useState<TableRules | null>(null);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  if (!isClient) return <LoadingMark />;

  const choice =
    choiceOverride ?? findMatchingPreset(stored) ?? "personalizzato";
  const rules = draft ?? stored;
  const custom = choice === "personalizzato";

  function update<K extends keyof TableRules>(key: K, value: TableRules[K]) {
    setDraft((prev) => ({ ...(prev ?? stored), [key]: value }));
    setSaved(false);
  }

  function persistCustom() {
    if (rulesDiffer(rules, stored)) {
      if (confirmResetMastery()) clearProgress();
    }
    saveRules(rules);
    setDraft(null);
    setSaved(true);
    setChoiceOverride(findMatchingPreset(rules) ?? "personalizzato");
  }

  function onPresetChange(value: string) {
    const next = value as PresetChoice;
    setSaved(false);
    setCleared(false);
    if (next === "personalizzato") {
      setChoiceOverride("personalizzato");
      setDraft(null);
      return;
    }
    const nextRules = { ...PRESETS[next].rules };
    if (rulesDiffer(nextRules, stored)) {
      if (confirmResetMastery()) clearProgress();
    }
    setChoiceOverride(next);
    setDraft(null);
    saveRules(nextRules);
  }

  async function onImportFile(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (
        !window.confirm(
          "Importare questo backup? Sovrascrive regole e progresso attuali.",
        )
      ) {
        return;
      }
      const result = importBackup(data);
      if (!result.ok) {
        setBackupMsg(result.error);
        return;
      }
      setDraft(null);
      setChoiceOverride(null);
      setBackupMsg("Backup importato.");
    } catch {
      setBackupMsg("Impossibile leggere il file.");
    }
  }

  const presetOptions = [
    ...PRESET_ORDER.map((id) => ({
      value: id,
      label: PRESETS[id].name,
      hint: PRESETS[id].description,
    })),
    {
      value: "personalizzato",
      label: "Personalizzato",
      hint: "Modifica le regole a mano",
    },
  ];

  return (
    <PageEnter>
      <PageHeader
        eyebrow="Impostazioni"
        title="Regole"
        subtitle="Scegli un casinò o personalizza. Tavolo e Allena seguono queste opzioni."
      />

      <div className="surface mt-7 space-y-5 overflow-visible rounded-3xl p-5">
        <Field label="Preset">
          <FancySelect
            ariaLabel="Preset regole"
            value={choice}
            onChange={onPresetChange}
            options={presetOptions}
          />
        </Field>

        {custom ? (
          <>
            <p className="text-xs leading-relaxed text-mist">
              Modifica e salva. Le mosse in app si aggiornano subito dopo il
              salvataggio.
            </p>
            <Field label="Hole card">
              <FancySelect
                ariaLabel="Hole card"
                value={rules.holeCard}
                onChange={(v) => update("holeCard", v as HoleCardRule)}
                options={[
                  {
                    value: "enhc",
                    label: "ENHC",
                    hint: "Seconda carta dopo i giocatori",
                  },
                  {
                    value: "peek",
                    label: "Peek",
                    hint: "Controlla blackjack subito",
                  },
                  {
                    value: "obo",
                    label: "OBO",
                    hint: "Solo puntata originale su BJ banco",
                  },
                ]}
              />
            </Field>

            <Field label="Soft 17 del banco">
              <SegmentedControl
                ariaLabel="Soft 17 del banco"
                value={rules.soft17}
                onChange={(v) => update("soft17", v as Soft17)}
                options={[
                  { value: "S17", label: "Sta (S17)" },
                  { value: "H17", label: "Pesca (H17)" },
                ]}
              />
            </Field>

            <Field label="Raddoppio">
              <SegmentedControl
                ariaLabel="Raddoppio"
                value={rules.double}
                onChange={(v) => update("double", v as DoubleRule)}
                options={[
                  { value: "nineToEleven", label: "Solo 9–11" },
                  { value: "any", label: "Qualsiasi" },
                ]}
              />
            </Field>

            <Toggle
              label="Double after split (DAS)"
              checked={rules.das}
              onChange={(v) => update("das", v)}
            />
            <Toggle
              label="Late surrender"
              checked={rules.surrender}
              onChange={(v) => update("surrender", v)}
            />

            <button
              type="button"
              onClick={persistCustom}
              className="btn-primary w-full"
            >
              {saved ? "Salvato ✓" : "Salva regole"}
            </button>
          </>
        ) : (
          <RulesReadonly rules={rules} />
        )}
      </div>

      <div className="surface mt-5 space-y-3 rounded-3xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-bright">
          App
        </p>
        <Toggle
          label="Suoni di feedback"
          checked={soundOn}
          onChange={(v) => {
            setSoundEnabled(v);
            if (v) feedback("tap");
          }}
        />
        <Toggle
          label="Avanti automatico"
          hint="In Allena, dopo una risposta corretta"
          checked={autoAdvance}
          onChange={setAutoAdvanceEnabled}
        />
      </div>

      <div className="surface mt-5 rounded-3xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-bright">
          I tuoi dati
        </p>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          Tutto resta <span className="font-semibold text-ivory">solo su questo
          dispositivo</span>. Cambia telefono o cancella i dati del sito → il
          progresso sparisce, salvo backup.
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              downloadBackup();
              setBackupMsg("File scaricato.");
            }}
            className="btn-secondary"
          >
            Esporta backup
          </button>
          <label className="btn-secondary cursor-pointer text-center">
            Importa backup
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                void onImportFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {backupMsg && (
          <p
            className="mt-3 text-sm text-champagne-bright"
            role="status"
            aria-live="polite"
          >
            {backupMsg}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.confirm("Azzerare tutto il progresso di studio?")
            ) {
              clearProgress();
              setCleared(true);
            }
          }}
          className="btn-secondary mt-4"
        >
          {cleared ? "Progresso azzerato" : "Azzera progresso"}
        </button>
        <button
          type="button"
          onClick={() => {
            resetOnboarding();
            window.location.href = "/";
          }}
          className="text-link mt-2"
        >
          Rivedi onboarding
        </button>
      </div>
    </PageEnter>
  );
}

function RulesReadonly({ rules }: { rules: TableRules }) {
  const rows: { label: string; value: string }[] = [
    {
      label: "Hole card",
      value:
        rules.holeCard === "enhc"
          ? "ENHC"
          : rules.holeCard === "peek"
            ? "Peek"
            : "OBO",
    },
    {
      label: "Soft 17",
      value: rules.soft17 === "S17" ? "Banco sta" : "Banco pesca",
    },
    {
      label: "Raddoppio",
      value: rules.double === "any" ? "Qualsiasi due carte" : "Solo 9–11",
    },
    { label: "DAS", value: rules.das ? "Sì" : "No" },
    { label: "Resa", value: rules.surrender ? "Sì" : "No" },
  ];

  return (
    <div>
      <p className="mb-3 text-xs leading-relaxed text-mist">
        Solo lettura — per modificare scegli{" "}
        <span className="font-semibold text-ivory">Personalizzato</span>.
      </p>
      <dl className="divide-y divide-ivory/10 rounded-2xl border border-ivory/10 bg-felt-deep/35">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <dt className="min-w-0 shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">
              {r.label}
            </dt>
            <dd className="min-w-0 text-right text-sm font-semibold leading-snug text-ivory">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-bright">
        {label}
      </p>
      {children}
    </div>
  );
}
