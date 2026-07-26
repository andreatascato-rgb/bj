"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppNav } from "@/components/ui/AppNav";
import { isOnboarded, subscribeStorage } from "@/lib/storage";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const sync = () => setOnboarded(isOnboarded());
    sync();
    return subscribeStorage(sync);
  }, []);

  useEffect(() => {
    if (onboarded !== false) return;
    if (pathname === "/" || pathname === "") return;
    router.replace("/");
  }, [onboarded, pathname, router]);

  const showNav = onboarded === true;
  const gating =
    onboarded === false && pathname !== "/" && pathname !== "";

  return (
    <>
      <div
        className={`relative mx-auto flex min-h-[100dvh] max-w-lg flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] ${
          showNav ? "pb-28" : "pb-[max(2.5rem,env(safe-area-inset-bottom))]"
        }`}
      >
        {gating ? null : children}
      </div>
      {showNav ? <AppNav /> : null}
    </>
  );
}
