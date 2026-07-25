# Pubblicare MANO a costo zero

Non serve un dominio a pagamento. Non serve App Store.

Stato prodotto al freeze: vedi [CHECKPOINT.md](./CHECKPOINT.md).

## Prima: codice su GitHub

1. Crea un repository (pubblico o privato) su [GitHub](https://github.com)
2. Dal progetto locale: commit + push (l’agente lo farà quando gli dai l’URL)
3. Verifica locale prima del deploy:

```bash
npm install
npm test
npm run build
```

La cartella pubblicabile è **`out/`**.

## Opzione A — Cloudflare Pages (consigliata)

1. Account gratis [Cloudflare](https://dash.cloudflare.com)
2. Workers & Pages → Create → Connect Git → seleziona il repo MANO
3. Build settings:
   - Framework preset: None (o static)
   - Build command: `npm run build`
   - Output directory: `out`
   - Node: **20+**
4. Deploy → URL tipo `https://mano.pages.dev`
5. Telefono: apri il link → menu browser → **Aggiungi alla schermata Home** (PWA)

## Opzione B — GitHub Pages

1. Abilita Pages sul repo (Settings → Pages)
2. Usa GitHub Action che fa `npm run build` e pubblica `out/`, **oppure** carica `out/` come artifact statico
3. Se il sito non è sulla root del dominio Pages, controlla `basePath` / asset paths (oggi l’app assume root `/`)
4. URL tipo `https://username.github.io/repo-name/`

## Opzione C — Solo sul PC (zero publish)

```bash
npm install
npm run dev
```

Apri `http://localhost:3000`. Hard refresh (Ctrl+Shift+R) dopo aggiornamenti.

Prova “come online”:

```bash
npm run build
npx --yes serve out
```

## Cosa non fare (costa o non serve)

- Comprare un dominio custom in v1
- Pubblicare su Apple App Store / Google Play
- Aggiungere database, auth o hosting a pagamento
- Servizi AI a pagamento per le mosse
