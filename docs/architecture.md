# MANO — Architecture (v0.2.0)

Agent-oriented map of the codebase. Product intent: `docs/product.md`. Freeze: `docs/CHECKPOINT.md`.

## Runtime model

- **Build:** `next build` with `output: 'export'` → `out/`
- **Hosting:** any static host (Cloudflare Pages / GitHub Pages)
- **Data:** `localStorage` keys `mano.rules.v1`, `mano.memory.v1`, `mano.onboarded.v1`, `mano.stats.v1`, `mano.installHint.v1`
- **Backup:** export/import JSON from Regole (`exportBackup` / `importBackup`)
- **Reactivity:** `useSyncExternalStore` in `src/lib/client.ts` over `subscribeStorage` in `src/lib/storage.ts` (cached snapshots to avoid infinite re-renders)

## Route → responsibility

| Route | File | Notes |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Studio + onboarding gate |
| `/tavolo/` | `src/app/tavolo/page.tsx` | Multi-phase consult |
| `/allenamento/` | `src/app/allenamento/page.tsx` | Drill session + end screen |
| `/tabella/` | `src/app/tabella/page.tsx` | Chart grid + heatmap |
| `/regole/` | `src/app/regole/page.tsx` | Rules draft → save |

Shell: `src/components/ui/AppShell.tsx` + `AppNav.tsx` (hidden when not onboarded).

## Engine pipeline

```
cards + dealerUp + TableRules
  → evaluateHand (hard/soft/pair)
  → chart cell (HARD_PEEK / SOFT_PEEK / PAIR_PEEK)
  → ENHC_OVERRIDES / H17_OVERRIDES
  → resolveCode (double/surrender availability)
  → Advice { action, reason, fallbackNote? }
```

## Learning pipeline

```
drill cell id
  → getOrCreateMemory
  → review(ok) SM-2
  → saveMemory → bumpStorage
  → masteryScore / isDue / heatmap colors
```

## UI primitives

| Piece | Where |
| --- | --- |
| Tokens / surfaces | `src/app/globals.css` |
| Cards / rank pick | `src/components/ui/RankPicker.tsx` |
| Selects | `src/components/ui/FancySelect.tsx` |
| Page chrome | `src/components/ui/PageChrome.tsx` |
| Motion tokens | `src/lib/motion.ts` |
| Onboarding | `src/components/studio/Onboarding.tsx` |
| PWA | `public/sw.js`, `public/manifest.webmanifest`, `ServiceWorkerRegister` |

## Tests

```bash
npm test          # engine
npm run build     # static export sanity
npm run lint      # eslint
```

Prefer new strategy behavior covered in `src/engine/advise.test.ts`.

## PWA note

Lightweight custom SW (not Serwist) so static export stays simple. Offline = cached shell + already-visited assets; strategy data is in the JS bundle.
