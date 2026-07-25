"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<() => void>();

function notifyInstall() {
  installListeners.forEach((l) => l());
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

export function canPromptInstall(): boolean {
  return deferred != null && !isStandalone();
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  const ev = deferred;
  deferred = null;
  notifyInstall();
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  return outcome;
}

/** Capture beforeinstallprompt once at app root. */
export function InstallPromptCapture() {
  useEffect(() => {
    function onBip(e: Event) {
      e.preventDefault();
      deferred = e as BeforeInstallPromptEvent;
      notifyInstall();
    }
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);
  return null;
}

export function useCanInstall(): boolean {
  const [can, setCan] = useState(false);
  useEffect(() => {
    const sync = () => setCan(canPromptInstall());
    sync();
    installListeners.add(sync);
    return () => {
      installListeners.delete(sync);
    };
  }, []);
  return can;
}

export function UpdateToast() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;

    let cancelled = false;

    async function setup() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const onUpdateFound = () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (
              nw.state === "installed" &&
              navigator.serviceWorker.controller &&
              !cancelled
            ) {
              setWaiting(nw);
            }
          });
        };
        reg.addEventListener("updatefound", onUpdateFound);
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaiting(reg.waiting);
        }
        // Periodic check when tab becomes visible
        const onVis = () => {
          if (document.visibilityState === "visible") void reg.update();
        };
        document.addEventListener("visibilitychange", onVis);
        return () => {
          reg.removeEventListener("updatefound", onUpdateFound);
          document.removeEventListener("visibilitychange", onVis);
        };
      } catch {
        return;
      }
    }

    let cleanup: (() => void) | undefined;
    void setup().then((c) => {
      cleanup = c;
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  const apply = useCallback(() => {
    if (!waiting) {
      window.location.reload();
      return;
    }
    waiting.postMessage({ type: "SKIP_WAITING" });
    const onController = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onController, {
      once: true,
    });
    // Fallback reload if controllerchange is slow
    window.setTimeout(() => window.location.reload(), 800);
  }, [waiting]);

  return (
    <AnimatePresence>
      {waiting ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-lg justify-center px-5"
        >
          <div className="surface flex w-full items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
            <p className="min-w-0 flex-1 text-sm text-mist">
              Nuova versione di MANO pronta.
            </p>
            <button
              type="button"
              onClick={apply}
              className="shrink-0 rounded-xl bg-champagne px-3.5 py-2 text-xs font-semibold text-felt-deep"
            >
              Aggiorna
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
