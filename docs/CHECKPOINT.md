# MANO — Checkpoint v0.3.0

**Freeze date:** 2026-07-26  
**Status:** Ship-ready. Brand, strategy authority, €0, and static export remain locked.

---

## Verdict

| Area | Complete? | Notes |
| --- | --- | --- |
| Studio (declutter + Pronto) | Yes | First viewport: brand · mastery · one CTA |
| Allena (queues, focus×4, auto-advance pref) | Yes | Weak→due fill; SM-2 solid ≥3 reps |
| Tabella heatmap = `isSolid` | Yes | aria-labels + 44px cells |
| Tavolo live follow-through | Yes | Hit · double card · split A/B · bust |
| Regole preset dropdown + mastery reset | Yes | Personalizzato editable |
| PWA icons PNG + SW `mano-v4` | Yes | Network-first HTML; cache-first static |
| Engine + SM-2 tests | Yes | Insurance, DAS, H17 Rs, surrender notes |
| A11y zoom / live regions / touch | Yes | No `maximumScale: 1` |

---

## Locked (unchanged)

1. Brand MANO · Italian · Fraunces + Manrope · felt/champagne  
2. Modes: Studio · Tavolo · Allena · Tabella · Regole  
3. Default IT/EU ENHC · Insurance = No · charts in engine  
4. Static export · no backend · no paid services  
5. Out of scope: counting, cloud, AI moves, stores  
6. Deploy target v0.3: **Cloudflare Pages** (`out/`, root `/`)  
7. Tavolo input order: **Banco → Tu → Mossa** (dealer first)

---

## Added in v0.3

- PWA: `icon-192/512`, maskable, apple-touch; manifest purposes fixed  
- SW `mano-v4`: HTML network-first; `/_next/static` cache-first  
- Mastery solid: reps ≥ 3 · EF ≥ 2.2 · interval ≥ 1  
- Warm-up fills weak then due; full sessions fill to target size  
- `?cell=` drills 4 reps; onboarding gates all routes  
- Rules change → confirm reset mastery  
- Surrender fallback notes; ENHC “soldi extra” only on demotes  
- Shared PageHeader / HandStage / RulesChip / Toggle / text-link  
- FancySelect keyboard; aria-live feedback / toast / loading  
- Manual advance default; optional auto-advance if correct (Regole)  
- Tavolo: track double card → total/bust lock; split hands + DAS double  

---

## Verify

```bash
npm test
npm run lint
npm run build
npm start   # serves out/ after build
```

### Manual PWA checklist

1. Build + serve `out/` over HTTPS (or Cloudflare Pages preview)  
2. Install to Home — icons not generic  
3. Open online once, then airplane mode — Studio/Allena load  
4. Pinch zoom works  
5. `prefers-reduced-motion`: no nav spring / card deal bounce  
6. Tavolo: Raddoppia → carta → totale; Dividi → mano A/B  
