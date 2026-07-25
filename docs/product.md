# MANO — Product

## Persona

Italian recreational blackjack player. Wants correct basic strategy and enough memorization to leave the phone at home.

## Jobs to be done

1. **Learn** — memorize hard / soft / pair decisions under my table rules
2. **Check** — if allowed, get the correct play in under 2 seconds
3. **Prepare** — 5-minute warm-up on weak cells before a session
4. **Graduate** — see mastery and know when the app can stay home

## Modes (v0.1.0)

| Mode | Route | Job |
| --- | --- | --- |
| Studio | `/` | Home, mastery, next action, onboarding |
| Tavolo | `/tavolo/` | Live consult: Banco → (assicurazione) → Tu → Mossa |
| Allena | `/allenamento/` | Drill / warm-up with SM-2 |
| Tabella | `/tabella/` | Chart + memory heatmap |
| Regole | `/regole/` | Presets + fine rules + reset progress |

Phones are often banned at tables — Studio/Allena are the path to autonomy; Tavolo is optional.

## Onboarding

First launch asks hole-card policy (ENHC vs Peek) and applies Italia or USA-leaning preset. Bottom nav hidden until done. Can re-run from Regole.

## Learning model

- ~150 drill cells (hard / soft / pairs × dealer upcards)
- Simplified SM-2 intervals in `src/learning/sm2.ts`
- Mastery % = share of cells at solid strength
- Warm-up prefers weak then due cells (cap ~20)
- Full drill: due-first, else full pool

## UX craft (locked)

- Felt deep green `#041611` / `#0c3d2f`, champagne accents, ivory text
- Fraunces (display) + Manrope (UI)
- Bottom nav with icons; label **Allena**; hidden during onboarding
- Motion: page enter, card deal, nav pill — respect `prefers-reduced-motion`
- Shared primitives: `.surface`, `.btn-primary` / `.btn-secondary`, `.choice-card`, `FancySelect`, `SegmentedControl`

## Success metrics (local only)

- Mastery % of drill cells at solid memory strength
- Warm-up / drill accuracy in-session
- Weak cells visible on Tabella heatmap

## Tone

Italian, adult, precise. Educational — never “guaranteed profit” or “beat the casino.”

## Explicit non-goals (v1)

Card counting, cloud sync, accounts, paid tiers, LLM move suggestions, App Store / Play Store.
