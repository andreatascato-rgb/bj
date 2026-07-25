<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MANO — Agent Operating Manual

Personal blackjack basic-strategy coach. Europe-first. Zero cost. You (the agent) are the sole builder; the user evaluates via chat only.

**Current freeze:** [docs/CHECKPOINT.md](docs/CHECKPOINT.md) — **v0.2.0** (2026-07-25). Read it before changing product shape.

## Product promise

MANO takes the user from “I need to look up ~150 cells” to “I know them by heart.”

- **Studio** (primary): spaced-repetition learning, heatmap, warm-up, mastery meter
- **Tavolo** (secondary): glanceable live coach for quick consults
- Goal in UI: when mastery is high, the app says they can leave it at home

Brand: **MANO**. UI language: **Italian**. No accounts. No backend. Offline-capable PWA.

## Non-negotiables

1. **€0 forever** — no paid services, paid fonts, paid APIs, paid domains in v1, App Store / Play Store, or “upgrade to continue”. Prefer Cloudflare Pages / GitHub Pages free URLs.
2. **No LLM strategy** — every action comes from tested lookup tables + pure engine code.
3. **Europe-first** — default preset is Italian/EU shoe ENHC (no hole card), not Vegas peek charts.
4. **Static export** — `output: 'export'`; 100% client-side; data only on device (localStorage).
5. **Craft** — felt + champagne design, Fraunces + Manrope, custom SVG cards. No Inter/Roboto/Arial. No purple-indigo AI slop. No dashboard clutter on first viewport.
6. **Scope discipline** — v1 excludes card counting, cloud sync, AI chat moves, composition-dependent full charts.

## Stack (locked)

- Next.js App Router + TypeScript + Tailwind CSS v4
- Static export + lightweight service worker PWA (compatible with `output: 'export'`)
- Framer Motion (≤3 intentional motion families)
- Vitest for engine
- SM-2 (simplified) for ~150 strategy cells
- Fonts: Fraunces (display) + Manrope (UI) via `next/font`
- Client state from localStorage via `useSyncExternalStore` (`src/lib/client.ts` + `src/lib/storage.ts`)

## Architecture

```
src/app/            routes: / Studio, /tavolo, /allenamento, /tabella, /regole
src/engine/         hand math + strategy lookup (pure, tested)
src/data/strategy/  charts + ENHC/H17 overlays
src/learning/       SM-2, mastery, weak/due cells
src/components/     ui / studio (onboarding)
src/lib/            storage + client hydration hooks + motion tokens
docs/               product, strategy, deploy, CHECKPOINT
public/             manifest, sw.js, icon
```

## Strategy authority

- Primary: European ENHC multi-deck charts (Wizard-of-Odds class)
- Onboarding must ask: ENHC vs Peek
- Insurance basic strategy = No
- See `docs/strategy.md`

## User flows (v0.2.0 complete)

1. **Onboarding** → hole-card + preset → Studio (nav hidden)
2. **Studio** → mastery + kind bars + Focus oggi → Allena / Tabella / Tavolo; install hint dismissible
3. **Allena** → queue SM-2 (`?cell=` for one situation) → keyboard 1–5 · auto-advance on correct → end screen (streak, missed)
4. **Tavolo** → Banco → (insurance if A) → carte → mossa → hit/split or bust → Nuova mano; rank keys A/2–9/0
5. **Tabella** → hard/soft/pair + heatmap → cell panel → Allena situazione
6. **Regole** → presets + fine rules → save; export/import backup; reset progress; re-onboard

Client persistence: `src/lib/storage.ts` + `useSyncExternalStore` (`mano.rules/memory/stats/onboarded`).

## UI craft (locked)

Felt + champagne. Shared: `.surface`, `.btn-primary`, `.btn-secondary`, `.choice-card`, `FancySelect`, `SegmentedControl`, `PageEnter`, `StepRail`. Never light text on white. Bottom nav label **Allena** (not Drill).

## Docs map

| File | Role |
| --- | --- |
| `docs/CHECKPOINT.md` | Freeze / what is decided |
| `docs/product.md` | Jobs, modes, craft, tone |
| `docs/strategy.md` | Charts, overlays, fallbacks |
| `docs/deploy-free.md` | €0 publish |
| `docs/architecture.md` | Code map for agents |
| `README.md` | User-facing Italian overview |

## Before coding in any chat

1. Read this file + `docs/CHECKPOINT.md` if touching product scope
2. Keep zero-cost + Europe-first + dual-mode UX
3. Prefer engine tests over UI guesswork for strategy questions
4. Do not invent strategy plays outside `src/engine` + `src/data/strategy`
