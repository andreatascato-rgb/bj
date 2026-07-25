# MANO — Strategy sources & rule profiles

## Authority

Moves come from published basic-strategy charts (Wizard-of-Odds class), not generative AI.

| Layer | Path |
| --- | --- |
| Tables | `src/data/strategy/charts.ts` |
| Lookup + fallbacks | `src/engine/advise.ts` |
| Hand totals | `src/engine/hand.ts` |
| Tests | `src/engine/advise.test.ts` (Vitest) |

Never invent plays in UI code. Change charts → add/adjust tests.

## Default preset: Casinò IT/EU tipico

- 6–8 deck shoe (`decks: 6` in app = multi-deck shoe chart)
- Dealer soft 17: S17 default (H17 selectable)
- Double on hard 9–11 only
- DAS: on by default
- No late surrender by default
- **ENHC**: dealer second card after players; doubles/splits lost to dealer BJ

## Profiles

| `holeCard` | Chart behavior |
| --- | --- |
| `enhc` | Base peek chart + ENHC overlays (no extra money vs 10/A in key spots) |
| `peek` | Base multi-deck chart |
| `obo` | Same as peek for playing decisions (original bets only on dealer BJ) |

## ENHC overlays (vs peek)

| Hand | Dealer | Play |
| --- | --- | --- |
| Hard 11 | 10 | Hit (not Double) |
| Hard 11 | A | Hit (not Double) |
| Hard 10 | A | Hit |
| 8,8 | A | Hit (not Split) |
| A,A | A | Hit (not Split) |

ENHC wins when both ENHC and H17 would conflict on the same cell.

## H17 overlays (on top of S17 base)

When `soft17 === "H17"`:

| Hand | Dealer | Play |
| --- | --- | --- |
| Hard 11 | A | Double (else Hit) |
| Soft 19 | 4 | Double (else Stand) |
| Soft 19 | 5 | Double (else Stand) |
| Hard 17 | A | Surrender if allowed, else Stand |

## Insurance

Always **No** under basic strategy (`getInsuranceAdvice`). Counting is out of scope.

## Double / surrender fallbacks

Chart codes `Dh` / `Ds` / `Rh` / `Rs` / `Rp` resolve using current rules. EU 9–11 double → soft doubles become Hit/Stand; no surrender → Hit/Stand/Split. UI may show `fallbackNote`.

## Presets in app

- **Italia** → ENHC-oriented EU shoe defaults
- **USA** → peek-leaning defaults (user must still confirm table)

## House edge note (educational)

Correct basic strategy on a fair EU shoe often leaves roughly ~0.5–0.7% house edge depending on rules. Wrong charts (e.g. USA peek on ENHC) add avoidable error.
