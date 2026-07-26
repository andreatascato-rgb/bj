"use client";

import Link from "next/link";

/** Compact rules identity — always links to Regole. */
export function RulesChip({ label }: { label: string }) {
  return (
    <Link
      href="/regole/"
      className="inline-flex min-h-11 max-w-full items-center truncate rounded-full border border-champagne/30 bg-felt-deep/40 px-3.5 py-2 text-[11px] font-semibold tracking-wide text-champagne-bright no-underline transition hover:border-champagne/55 hover:bg-felt-deep/60"
    >
      {label}
    </Link>
  );
}

/**
 * Shared page title block.
 * - `page`: Tabella / Regole / Tavolo (eyebrow + 4xl)
 * - `session`: Allena in-progress (eyebrow + 3xl counter)
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  rulesLabel,
  actions,
  size = "page",
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  rulesLabel?: string;
  actions?: React.ReactNode;
  size?: "page" | "session";
}) {
  const heading =
    size === "session"
      ? "mt-1.5 font-display text-3xl text-ivory"
      : "mt-2 font-display text-4xl text-ivory";

  const body = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne-bright">
        {eyebrow}
      </p>
      <h1 className={heading}>{title}</h1>
      {subtitle ? (
        <div className="mt-2 text-[15px] leading-relaxed text-mist">
          {subtitle}
        </div>
      ) : null}
      {rulesLabel ? (
        <div className="mt-3">
          <RulesChip label={rulesLabel} />
        </div>
      ) : null}
    </>
  );

  if (!actions) {
    return <header>{body}</header>;
  }

  return (
    <header
      className={`flex justify-between gap-3 ${
        size === "session" ? "items-end" : "items-start"
      }`}
    >
      <div className="min-w-0">{body}</div>
      <div
        className={`flex shrink-0 items-center gap-2 ${
          size === "page" ? "pt-0.5" : "pb-1"
        }`}
      >
        {actions}
      </div>
    </header>
  );
}
