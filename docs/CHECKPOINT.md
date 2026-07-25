# MANO — Checkpoint v0.2.0

**Freeze date:** 2026-07-25  
**Status:** v0.2 usefulness pass on top of v0.1.0. Brand, strategy authority, €0, and static export remain locked.

---

## Verdict

| Area | Complete? | Notes |
| --- | --- | --- |
| Studio coach (focus, mastery/kind, install hint) | Yes | Top weak cells + category % |
| Allena (keyboard, auto-advance, ?cell=, streak) | Yes | Session stats in localStorage |
| Tabella → drill cell | Yes | Shared `cellId` + CTA |
| Tavolo (keyboard ranks, bust UX, card suits) | Yes | Decorative suits only |
| Backup export/import | Yes | Regole → JSON file |
| PWA SW | Yes | `mano-v2` |
| Engine tests | Expanded | Soft H17, surrender, insurance, pairs |

---

## Locked (unchanged from v0.1)

1. Brand MANO · Italian · Fraunces + Manrope · felt/champagne  
2. Modes: Studio · Tavolo · Allena · Tabella · Regole  
3. Default IT/EU ENHC · Insurance = No · charts in engine  
4. Static export · no backend · no paid services  
5. Out of scope: counting, cloud, AI moves, stores  

---

## Added in v0.2

- Focus oggi + mastery Hard/Soft/Coppie  
- Drill `?cell=` + keyboard + auto-advance on correct  
- Tabella “Allena questa situazione”  
- Rank keyboard + bust clear + decorative suits  
- `mano.stats.v1` + backup JSON  
- SW cache bump  

---

## Verify

```bash
npm test
npm run lint
npm run build
```
