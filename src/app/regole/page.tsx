"use client";

import { useState } from "react";
import {
  PRESETS,
  type DoubleRule,
  type HoleCardRule,
  type Soft17,
  type TableRules,
} from "@/engine/types";
import { useIsClient, useRules } from "@/lib/client";
import {
  clearMemory,
  downloadBackup,
  importBackup,
  resetOnboarding,
  saveRules,
} from "@/lib/storage";
import { LoadingMark, PageEnter } from "@/components/ui/PageChrome";
import {
  FancySelect,
  SegmentedControl,
} from "@/components/ui/FancySelect";

export default function RegolePage() {
  const isClient = useIsClient();
  const stored = useRules();
  const [draft, setDraft] = useState<TableRules | null>(null);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  if (!isClient) return <LoadingMark />;

  const rules = draft ?? stored;

  function update<K extends keyof TableRules>(key: K, value: TableRules[K]) {
    setDraft((prev) => ({ ...(prev ?? stored), [key]: value }));
    setSaved(false);
    setCleared(false);
  }

  function persist() {
    saveRules(rules);
    setDraft(null);
    setSaved(true);
  }

  function applyPreset(id: "italia" | "usa") {
    const next = { ...PRESETS[id].rules };
    setDraft(null);
    saveRules(next);
    setSaved(true);
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
      setBackupMsg("Backup importato.");
    } catch {
      setBackupMsg("Impossibile leggere il file.");
    }
  }

  return (
    <PageEnter>
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne-bright">
          Impostazioni
        </p>
        <h1 className="mt-2 font-display text-4xl text-ivory">Regole</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-mist">
          Allinea MANO al tuo casinò. Le mosse dipendono da queste opzioni.
        </p>
      </header>

      <div className="mt-7 space-y-3">
        <button
          type="button"
          onClick={() => applyPreset("italia")}
          className={`choice-card ${
            rules.holeCard === "enhc" && rules.double === "nineToEleven"
              ? "choice-card-active"
              : ""
          }`}
        >
          <span className="block font-display text-xl text-champagne-bright">
            {PRESETS.italia.name}
          </span>
          <span className="mt-1 block text-sm text-mist">
            {PRESETS.italia.description}
          </span>
        </button>
        <button
          type="button"
          onClick={() => applyPreset("usa")}
          className={`choice-card ${
            rules.holeCard === "peek" && rules.double === "any"
              ? "choice-card-active"
              : ""
          }`}
        >
          <span className="block font-display text-xl text-ivory">
            {PRESETS.usa.name}
          </span>
          <span className="mt-1 block text-sm text-mist">
            {PRESETS.usa.description}
          </span>
        </button>
      </div>

      <div className="surface mt-8 space-y-6 overflow-visible rounded-3xl p-5">
        <p className="text-xs leading-relaxed text-mist">
          Le mosse in Tavolo, Allena e Tabella si aggiornano subito quando salvi.
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
      </div>

      <button type="button" onClick={persist} className="btn-primary mt-8">
        {saved ? "Salvato ✓" : "Salva regole"}
      </button>

      <div className="surface mt-8 rounded-3xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-bright">
          Backup
        </p>
        <p className="mt-2 text-sm text-mist">
          Esporta regole e progresso su un file JSON. Resta sul tuo dispositivo —
          nessun account.
        </p>
        <button
          type="button"
          onClick={() => {
            downloadBackup();
            setBackupMsg("File scaricato.");
          }}
          className="btn-secondary mt-4"
        >
          Esporta backup
        </button>
        <label className="btn-secondary mt-3 block cursor-pointer text-center">
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
        {backupMsg && (
          <p className="mt-3 text-sm text-champagne-bright">{backupMsg}</p>
        )}
      </div>

      <div className="surface mt-8 rounded-3xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-bright">
          Progresso
        </p>
        <p className="mt-2 text-sm text-mist">
          Cancella mastery, heatmap e memoria delle celle. Le regole restano.
        </p>
        <button
          type="button"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.confirm("Azzerare tutto il progresso di studio?")
            ) {
              clearMemory();
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
          className="mt-3 w-full py-2 text-sm text-mist underline-offset-4 hover:text-ivory hover:underline"
        >
          Rivedi onboarding
        </button>
      </div>
    </PageEnter>
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-ivory/12 bg-felt-deep/35 px-4 py-3.5"
    >
      <span className="text-sm font-medium text-ivory">{label}</span>
      <span className="flex items-center gap-2.5">
        <span
          className={`text-xs font-semibold ${
            checked ? "text-champagne-bright" : "text-mist"
          }`}
        >
          {checked ? "Attivo" : "Spento"}
        </span>
        <span
          className={`relative h-7 w-12 rounded-full transition ${
            checked ? "bg-champagne" : "bg-ivory/15"
          }`}
          aria-hidden
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-felt-deep shadow transition ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </span>
    </button>
  );
}
