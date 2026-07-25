import { useSyncExternalStore } from "react";
import { DEFAULT_RULES, type TableRules } from "@/engine/types";
import type { CardMemory } from "@/learning/sm2";
import {
  isInstallHintDismissed,
  isOnboarded,
  loadMemory,
  loadRules,
  loadStats,
  subscribeStorage,
  type AppStats,
} from "./storage";

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
  return useSyncExternalStore(subscribeStorage, loadMemory, () => ({}));
}

export function useOnboarded(): boolean {
  return useSyncExternalStore(subscribeStorage, isOnboarded, () => true);
}

export function useStats(): AppStats {
  return useSyncExternalStore(subscribeStorage, loadStats, () => ({
    sessions: 0,
    lastAccuracy: null,
    lastSessionAt: null,
    bestStreak: 0,
  }));
}

export function useInstallHintDismissed(): boolean {
  return useSyncExternalStore(
    subscribeStorage,
    isInstallHintDismissed,
    () => true,
  );
}
