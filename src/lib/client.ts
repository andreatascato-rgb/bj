import { useSyncExternalStore } from "react";
import { DEFAULT_RULES, type TableRules } from "@/engine/types";
import type { CardMemory } from "@/learning/sm2";
import {
  isOnboarded,
  loadMemory,
  loadRules,
  subscribeStorage,
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
