# MANO — Checkpoint v0.1.0

**Freeze date:** 2026-07-25  
**Status:** Product slice locked. Do not casually rewrite flows, visual language, or strategy authority without an explicit product decision.

This file is the “what is decided” record so later work builds *on* v0.1.0 instead of reopening it.

---

## Verdict

| Area | Complete for v1? | Top-tier 2026? |
| --- | --- | --- |
| Product scope (Studio + Tavolo + learn) | Yes | Yes for personal coach |
| Strategy engine + tests | Yes | Yes (lookup tables, no LLM) |
| Learning (SM-2, mastery, heatmap) | Yes | Solid; not Anki-grade polish |
| UI craft (felt/champagne, IT) | Yes | Strong craft; not App-Store spectacle |
| PWA / offline / €0 | Yes | Fit for purpose |
| Deploy docs | Yes | Ready when GitHub URL arrives |

**Bottom line:** v0.1.0 is a complete, shippable personal coach for the stated promise. It is not a commercial casino-simulator platform — and that is intentional.

---

## Locked in (do not reopen without ask)

1. **Brand:** MANO · Italian UI · Fraunces + Manrope · felt `#041611`/`#0c3d2f` + champagne  
2. **Modes:** Studio (primary learn) · Tavolo (glance consult) · Allena · Tabella · Regole  
3. **Rules default:** IT/EU ENHC multi-deck · Insurance = No · charts in `src/data/strategy` + `src/engine`  
4. **Stack:** Next.js App Router static export · Tailwind v4 · Framer Motion · Vitest · localStorage · lightweight SW  
5. **€0 forever:** no paid APIs, fonts, domains, stores, or backend in this line of product  
6. **Out of v1:** card counting, cloud sync, AI chat moves, full composition-dependent charts, native stores  

---

## Verified green at freeze

- `npm test` → 13 Vitest tests pass  
- `npm run build` → static routes `/`, `/tavolo/`, `/allenamento/`, `/tabella/`, `/regole/`  

---

## What can come *after* this checkpoint (optional)

Nice-to-haves, not blockers: richer card suits/backs, sound, install prompts polish, more engine edge-case tests, GitHub Actions deploy to Pages/Cloudflare.

---

## Next step (user-gated)

1. User provides GitHub repo URL (or creates empty repo)  
2. Agent: commit all checkpoint work + push  
3. Optional: Cloudflare Pages / GitHub Pages from `out/`  

Until then, this tree + `docs/` are the source of truth for “what we built.”
