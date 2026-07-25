"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

export function PageEnter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <main className={`flex flex-1 flex-col ${className}`}>{children}</main>;
  }
  return (
    <motion.main
      className={`flex flex-1 flex-col ${className}`}
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      transition={fadeUp.transition}
    >
      {children}
    </motion.main>
  );
}

export function LoadingMark({ label = "MANO" }: { label?: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-champagne/20" />
        <span className="absolute inset-0 rounded-full border-2 border-champagne/30 border-t-champagne" />
      </div>
      <p className="font-display text-xl tracking-wide text-champagne-bright">
        {label}
      </p>
    </main>
  );
}

export function StepRail({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={label}
            className={`flex h-8 items-center justify-center rounded-full px-2 text-[11px] font-semibold tracking-wide transition ${
              active
                ? "bg-champagne text-felt-deep shadow-[0_6px_18px_rgba(224,184,106,0.35)]"
                : done
                  ? "bg-champagne/20 text-champagne-bright"
                  : "bg-ivory/8 text-mist"
            }`}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}
