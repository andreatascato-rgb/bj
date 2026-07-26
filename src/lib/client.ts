import { useSyncExternalStore } from "react";
import { DEFAULT_RULES, type TableRules } from "@/engine/types";
import type { CardMemory } from "@/learning/sm2";
import {
  isAutoAdvanceEnabled,
  isInstallHintDismissed,
  isOnboarded,
  loadMemory,
  loadRules,
  loadStats,
  subscribeStorage,
  type AppStats,
} from "./storage";

/** Stable server snapshots — new object literals each call → infinite loop */
const EMPTY_MEMORY: Record<string, CardMemory> = {};
const EMPTY_STATS: AppStats = {
  sessions: 0,
  lastAccuracy: null,
  lastSessionAt: null,
  bestStreak: 0,
};

/** False during SSG / first server snapshot; true on client. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useRules(): TableRules {
  return useSyncExternalStore(subscribeStorage, loadRules, () => DEFAULT_RULES);
}

export function useMemory(): Record<string, CardMemory> {
  return useSyncExternalStore(subscribeStorage, loadMemory, () => EMPTY_MEMORY);
}

export function useOnboarded(): boolean {
  return useSyncExternalStore(subscribeStorage, isOnboarded, () => true);
}

export function useStats(): AppStats {
  return useSyncExternalStore(subscribeStorage, loadStats, () => EMPTY_STATS);
}

export function useInstallHintDismissed(): boolean {
  return useSyncExternalStore(
    subscribeStorage,
    isInstallHintDismissed,
    () => true,
  );
}

export function useAutoAdvance(): boolean {
  return useSyncExternalStore(
    subscribeStorage,
    isAutoAdvanceEnabled,
    () => false,
  );
}
