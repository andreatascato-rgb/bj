"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

const LINKS = [
  {
    href: "/",
    label: "Studio",
    icon: (
      <path
        d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
    ),
  },
  {
    href: "/tavolo/",
    label: "Tavolo",
    icon: (
      <>
        <rect
          x="3"
          y="4"
          width="10"
          height="14"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
        />
        <rect
          x="11"
          y="6"
          width="10"
          height="14"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
        />
      </>
    ),
  },
  {
    href: "/allenamento/",
    label: "Allena",
    icon: (
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/tabella/",
    label: "Tabella",
    icon: (
      <>
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M3 9h18M3 15h18M9 3v18M15 3v18"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </>
    ),
  },
  {
    href: "/regole/",
    label: "Regole",
    icon: (
      <>
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M12 8v5M12 15.5v.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
];

export function AppNav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-felt-line bg-felt-deep/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2 pt-2 pb-2">
        {LINKS.map((l) => {
          const active =
            l.href === "/"
              ? pathname === "/"
              : pathname.startsWith(l.href.replace(/\/$/, ""));
          return (
            <li key={l.href} className="relative flex-1">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative z-10 flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 select-none transition ${
                  active ? "text-champagne-bright" : "text-mist"
                }`}
              >
                {active ? (
                  reduce ? (
                    <span className="absolute inset-0 -z-10 rounded-xl bg-champagne/15" />
                  ) : (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-xl bg-champagne/15"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )
                ) : null}
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="opacity-95"
                >
                  {l.icon}
                </svg>
                <span className="text-[10px] font-semibold tracking-wide">
                  {l.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
