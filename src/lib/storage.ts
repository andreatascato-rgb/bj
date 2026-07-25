import { DEFAULT_RULES, type TableRules } from "@/engine/types";
import { defaultMemory, type CardMemory } from "@/learning/sm2";

const RULES_KEY = "mano.rules.v1";
const MEMORY_KEY = "mano.memory.v1";
const ONBOARD_KEY = "mano.onboarded.v1";

const listeners = new Set<() => void>();

let rulesCache: TableRules = DEFAULT_RULES;
let rulesRaw: string | null | undefined;
let memoryCache: Record<string, CardMemory> = {};
let memoryRaw: string | null | undefined;
let onboardCache: boolean | undefined;

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
    onboardCache = undefined;
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

export function clearMemory(): void {
  localStorage.removeItem(MEMORY_KEY);
  memoryRaw = null;
  memoryCache = {};
  bumpStorage();
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARD_KEY);
  onboardCache = false;
  bumpStorage();
}
