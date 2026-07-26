"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
};

/** Felt-styled select — no native OS menu */
export function FancySelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const reduce = useReducedMotion();
  const selected = options.find((o) => o.value === value) ?? options[0];
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((i) => (i + 1) % options.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((i) => (i - 1 + options.length) % options.length);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        setHighlight(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        setHighlight(options.length - 1);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const opt = options[highlight];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, options, highlight, onChange]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={`${ariaLabel}: ${selected?.label ?? ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setHighlight(selectedIndex);
          setOpen((v) => !v);
        }}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border bg-felt-deep px-4 py-3.5 text-left transition ${
          open
            ? "border-champagne/60 shadow-[0_0_0_1px_rgba(224,184,106,0.2)]"
            : "border-ivory/14"
        }`}
      >
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-ivory">
            {selected?.label}
          </span>
          {selected?.hint ? (
            <span className="mt-0.5 block truncate text-xs text-mist">
              {selected.hint}
            </span>
          ) : null}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-champagne/12 text-champagne-bright transition ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 5.2 7 9l4-3.8"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            initial={reduce ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.16 }}
            className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-champagne/25 bg-felt-deep p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
          >
            {options.map((o, i) => {
              const active = o.value === value;
              const focused = i === highlight;
              return (
                <li key={o.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`flex w-full flex-col rounded-xl px-3.5 py-3 text-left transition ${
                      active
                        ? "bg-champagne/15 text-champagne-bright"
                        : focused
                          ? "bg-ivory/8 text-ivory"
                          : "text-ivory hover:bg-ivory/6"
                    }`}
                  >
                    <span className="text-[15px] font-semibold">{o.label}</span>
                    {o.hint ? (
                      <span
                        className={`mt-0.5 text-xs ${
                          active ? "text-champagne-bright/80" : "text-mist"
                        }`}
                      >
                        {o.hint}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Pill segmented control — 2–4 options (equal columns). */
export function SegmentedControl({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  const cols =
    options.length <= 2
      ? "grid-cols-2"
      : options.length === 3
        ? "grid-cols-3"
        : "grid-cols-4";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`grid min-h-[3.25rem] ${cols} gap-1.5 rounded-xl border border-ivory/12 bg-felt-deep/40 p-1.5`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-2 py-2.5 text-center text-sm font-semibold transition ${
              active
                ? "bg-champagne text-felt-deep shadow-[0_6px_16px_rgba(224,184,106,0.28)]"
                : "text-mist hover:text-ivory"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
