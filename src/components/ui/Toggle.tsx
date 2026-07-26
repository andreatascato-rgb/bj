"use client";

/** Felt toggle row — label left, switch right. Always left-aligned text. */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-xl border border-ivory/12 bg-felt-deep/35 px-4 py-3.5 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug text-ivory">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-xs leading-snug text-mist">
            {hint}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-2.5" aria-hidden>
        <span
          className={`w-12 text-right text-xs font-semibold tabular-nums ${
            checked ? "text-champagne-bright" : "text-mist"
          }`}
        >
          {checked ? "Attivo" : "Spento"}
        </span>
        <span
          className={`relative h-7 w-12 rounded-full transition ${
            checked ? "bg-champagne" : "bg-ivory/15"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-felt-deep shadow transition ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </span>
    </button>
  );
}
