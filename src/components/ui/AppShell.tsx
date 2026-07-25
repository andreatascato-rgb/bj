"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/ui/AppNav";
import { isOnboarded } from "@/lib/storage";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setOnboarded(isOnboarded());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("mano:onboarded", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("mano:onboarded", sync);
    };
  }, []);

  const showNav = onboarded === true;

  return (
    <>
      <div
        className={`relative mx-auto flex min-h-[100dvh] max-w-lg flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] ${
          showNav ? "pb-28" : "pb-[max(2.5rem,env(safe-area-inset-bottom))]"
        }`}
      >
        {children}
      </div>
      {showNav ? <AppNav /> : null}
    </>
  );
}
