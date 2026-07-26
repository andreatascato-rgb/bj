import { DEFAULT_RULES, type TableRules } from "@/engine/types";
import { defaultMemory, type CardMemory } from "@/learning/sm2";

const RULES_KEY = "mano.rules.v1";
const MEMORY_KEY = "mano.memory.v1";
const ONBOARD_KEY = "mano.onboarded.v1";
const STATS_KEY = "mano.stats.v1";
const INSTALL_HINT_KEY = "mano.installHint.v1";
const AUTO_ADVANCE_KEY = "mano.autoAdvance.v1";
const BACKUP_VERSION = 1;

export interface AppStats {
  sessions: number;
  lastAccuracy: number | null;
  lastSessionAt: number | null;
  bestStreak: number;
}

export interface ManoBackup {
  version: number;
  exportedAt: number;
  rules: TableRules;
  memory: Record<string, CardMemory>;
  stats: AppStats;
  onboarded: boolean;
  /** Optional — older backups may omit */
  sound?: boolean;
  /** Optional — older backups may omit; default off */
  autoAdvance?: boolean;
}

const DEFAULT_STATS: AppStats = {
  sessions: 0,
  lastAccuracy: null,
  lastSessionAt: null,
  bestStreak: 0,
};

const listeners = new Set<() => void>();

let rulesCache: TableRules = DEFAULT_RULES;
let rulesRaw: string | null | undefined;
let memoryCache: Record<string, CardMemory> = {};
let memoryRaw: string | null | undefined;
let statsCache: AppStats = DEFAULT_STATS;
let statsRaw: string | null | undefined;
let onboardCache: boolean | undefined;
let installHintCache: boolean | undefined;
let autoAdvanceCache: boolean | undefined;

function bumpStorage(): void {
  listeners.forEach((l) => l());
}

/** Same-tab via bump; cross-tab via `storage` events. */
export function subscribeStorage(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (!e.key?.startsWith("mano.")) return;
    rulesRaw = undefined;
    memoryRaw = undefined;
    statsRaw = undefined;
    onboardCache = undefined;
    installHintCache = undefined;
    autoAdvanceCache = undefined;
    cb();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function loadRules(): TableRules {
  if (typeof window === "undefined") return DEFAULT_RULES;
  try {
    const raw = localStorage.getItem(RULES_KEY);
    if (raw === rulesRaw) return rulesCache;
    rulesRaw = raw;
    rulesCache = raw ? { ...DEFAULT_RULES, ...JSON.parse(raw) } : DEFAULT_RULES;
    return rulesCache;
  } catch {
    return DEFAULT_RULES;
  }
}

export function saveRules(rules: TableRules): void {
  const raw = JSON.stringify(rules);
  localStorage.setItem(RULES_KEY, raw);
  rulesRaw = raw;
  rulesCache = rules;
  bumpStorage();
}

export function loadMemory(): Record<string, CardMemory> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (raw === memoryRaw) return memoryCache;
    memoryRaw = raw;
    memoryCache = raw ? JSON.parse(raw) : {};
    return memoryCache;
  } catch {
    return {};
  }
}

export function saveMemory(map: Record<string, CardMemory>): void {
  const raw = JSON.stringify(map);
  localStorage.setItem(MEMORY_KEY, raw);
  memoryRaw = raw;
  memoryCache = map;
  bumpStorage();
}

export function upsertMemory(
  id: string,
  next: CardMemory,
): Record<string, CardMemory> {
  const map = { ...loadMemory(), [id]: next };
  saveMemory(map);
  return map;
}

export function getOrCreateMemory(id: string): CardMemory {
  const map = loadMemory();
  return map[id] ?? defaultMemory();
}

export function loadStats(): AppStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw === statsRaw) return statsCache;
    statsRaw = raw;
    statsCache = raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : DEFAULT_STATS;
    return statsCache;
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: AppStats): void {
  const raw = JSON.stringify(stats);
  localStorage.setItem(STATS_KEY, raw);
  statsRaw = raw;
  statsCache = stats;
  bumpStorage();
}

export function recordSession(accuracy: number, maxStreak: number): AppStats {
  const prev = loadStats();
  const next: AppStats = {
    sessions: prev.sessions + 1,
    lastAccuracy: accuracy,
    lastSessionAt: Date.now(),
    bestStreak: Math.max(prev.bestStreak, maxStreak),
  };
  saveStats(next);
  return next;
}

export function isOnboarded(): boolean {
  if (typeof window === "undefined") return true;
  if (onboardCache !== undefined) return onboardCache;
  onboardCache = localStorage.getItem(ONBOARD_KEY) === "1";
  return onboardCache;
}

export function setOnboarded(): void {
  localStorage.setItem(ONBOARD_KEY, "1");
  onboardCache = true;
  bumpStorage();
}

export function isInstallHintDismissed(): boolean {
  if (typeof window === "undefined") return true;
  if (installHintCache !== undefined) return installHintCache;
  installHintCache = localStorage.getItem(INSTALL_HINT_KEY) === "1";
  return installHintCache;
}

export function dismissInstallHint(): void {
  localStorage.setItem(INSTALL_HINT_KEY, "1");
  installHintCache = true;
  bumpStorage();
}

/** Allena: auto-advance after a correct answer. Default off (manual). */
export function isAutoAdvanceEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (autoAdvanceCache !== undefined) return autoAdvanceCache;
  autoAdvanceCache = localStorage.getItem(AUTO_ADVANCE_KEY) === "1";
  return autoAdvanceCache;
}

export function setAutoAdvanceEnabled(on: boolean): void {
  localStorage.setItem(AUTO_ADVANCE_KEY, on ? "1" : "0");
  autoAdvanceCache = on;
  bumpStorage();
}

export function clearMemory(): void {
  localStorage.removeItem(MEMORY_KEY);
  memoryRaw = null;
  memoryCache = {};
  bumpStorage();
}

/** Wipe learning progress + session stats. Rules / sound / onboard stay. */
export function clearProgress(): void {
  localStorage.removeItem(MEMORY_KEY);
  localStorage.removeItem(STATS_KEY);
  memoryRaw = null;
  memoryCache = {};
  statsRaw = null;
  statsCache = DEFAULT_STATS;
  bumpStorage();
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARD_KEY);
  onboardCache = false;
  bumpStorage();
}

export function exportBackup(): ManoBackup {
  const sound =
    typeof window !== "undefined"
      ? localStorage.getItem("mano.sound.v1") !== "0"
      : true;
  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    rules: loadRules(),
    memory: loadMemory(),
    stats: loadStats(),
    onboarded: isOnboarded(),
    sound,
    autoAdvance: isAutoAdvanceEnabled(),
  };
}

export function importBackup(data: unknown): { ok: true } | { ok: false; error: string } {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "File non valido." };
  }
  const b = data as Partial<ManoBackup>;
  if (b.version !== BACKUP_VERSION) {
    return { ok: false, error: "Versione backup non supportata." };
  }
  if (!b.rules || typeof b.rules !== "object") {
    return { ok: false, error: "Regole mancanti nel backup." };
  }
  if (!b.memory || typeof b.memory !== "object") {
    return { ok: false, error: "Memoria mancante nel backup." };
  }

  saveRules({ ...DEFAULT_RULES, ...b.rules });
  saveMemory(b.memory as Record<string, CardMemory>);
  saveStats({ ...DEFAULT_STATS, ...(b.stats ?? {}) });
  if (typeof b.sound === "boolean") {
    localStorage.setItem("mano.sound.v1", b.sound ? "1" : "0");
  }
  if (typeof b.autoAdvance === "boolean") {
    setAutoAdvanceEnabled(b.autoAdvance);
  }
  if (b.onboarded) setOnboarded();
  else resetOnboarding();
  bumpStorage();
  return { ok: true };
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mano-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
