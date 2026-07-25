# MANO

Coach personale di **basic strategy** blackjack — Europa-first, offline, **€0**.

**Versione congelata:** [docs/CHECKPOINT.md](docs/CHECKPOINT.md) · **v0.1.0**

## Cosa fa

| Sezione | Uso |
| --- | --- |
| **Studio** | Mastery, warm-up, prossimo passo |
| **Tavolo** | Consulto rapido (banco → tue carte → mossa) |
| **Allena** | Drill / warm-up con ripetizione spaziata |
| **Tabella** | Chart + heatmap dei tuoi errori |
| **Regole** | Preset IT/EU o USA + dettagli tavolo |

I progressi restano sul **tuo telefono** (niente account).

## Avvio sul PC

Serve [Node.js](https://nodejs.org/) 20+ (gratis).

```bash
npm install
npm run dev
```

Apri `http://localhost:3000` (hard refresh: Ctrl+Shift+R se non vedi gli aggiornamenti).

## Test e build

```bash
npm test
npm run build
```

## Pubblicare gratis sul telefono

```bash
npm run build
```

Cartella `out/` → Cloudflare Pages o GitHub Pages. Guida: [docs/deploy-free.md](docs/deploy-free.md).

## Per te (senza programmare)

1. Onboarding: seconda carta del banco **dopo** i giocatori (Italia) o subito
2. **Warm-up** o **Allena** per memorizzare
3. **Tavolo** solo se il casinò consente il telefono
4. Controlla **Regole** se il tuo tavolo è diverso dal preset

## Documenti

| Doc | Contenuto |
| --- | --- |
| [docs/CHECKPOINT.md](docs/CHECKPOINT.md) | Cosa è deciso / freeze |
| [AGENTS.md](AGENTS.md) | Manuale agente |
| [docs/product.md](docs/product.md) | Prodotto e UX |
| [docs/strategy.md](docs/strategy.md) | Fonti strategie |
| [docs/architecture.md](docs/architecture.md) | Mappa codice |
| [docs/deploy-free.md](docs/deploy-free.md) | Deploy €0 |

Educativo: non garantisce vincite. Verifica sempre le regole del tavolo.
