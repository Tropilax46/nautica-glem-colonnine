# Deploy della webapp client su Vercel — passo per passo

La webapp gira in **modalità demo** (default): non serve alcun backend, esattamente
come la dashboard-admin già online. Il codice è già su GitHub nel repo
`Tropilax46/nautica-glem-colonnine`, cartella `webapp-client/`.

---

## Metodo consigliato — importa il repo GitHub (5 minuti)

1. Vai su **https://vercel.com** e accedi (lo stesso account con cui hai messo
   online `admin.nauticaglem.it`).
2. **Add New… → Project**.
3. Scegli il repository **`nautica-glem-colonnine`** (se non compare: *Adjust
   GitHub App permissions* e dai accesso al repo).
4. Nella schermata di configurazione, l'unico campo importante:
   - **Root Directory** → clicca *Edit* e seleziona **`webapp-client`**.
   - Framework Preset: *Next.js* (rilevato in automatico).
   - Build/Output/Install: lascia i default.
5. **Environment Variables**: nessuna necessaria per la demo. *(Salta pure.)*
6. **Deploy**. Dopo ~1–2 minuti hai un URL tipo
   `nautica-glem-colonnine-xxxx.vercel.app`.
7. Apri l'URL → premi **Accedi** (in demo va bene qualsiasi email/password) →
   sei dentro.

> È lo stesso flusso della dashboard-admin: lì il Root Directory è
> `dashboard-admin`, qui è `webapp-client`. Due progetti Vercel separati che
> puntano allo stesso repo.

### Dominio personalizzato (opzionale)
Nel progetto Vercel → **Settings → Domains** → aggiungi `app.nauticaglem.it`
e crea su Aruba/Cloudflare il record **CNAME** `app` → `cname.vercel-dns.com`
(Vercel ti mostra il valore esatto). Così avrai `app.nauticaglem.it` accanto a
`admin.nauticaglem.it`.

---

## Metodo alternativo — Vercel CLI dal tuo PC

```bash
npm i -g vercel
cd "Desktop\Geno\Nautica GLEM\Colonnine\webapp-client"
vercel            # primo deploy: rispondi alle domande, è la root corrente
vercel --prod     # deploy in produzione
```

Quando chiede la directory del progetto, conferma quella corrente
(`webapp-client`).

---

## Prima di tutto: fai arrivare le ultime modifiche su GitHub

Le modifiche di oggi (modalità demo) devono essere sul repo, altrimenti Vercel
builda la versione vecchia.

**Pulizia preliminare** (un attimo, sul tuo PC Windows):

```bat
cd "Desktop\Geno\Nautica GLEM\Colonnine"

:: 1) rimuovi il node_modules parziale lasciato da una install interrotta
rmdir /s /q webapp-client\node_modules

:: 2) se git si lamenta di "index.lock", elimina il file bloccato
del .git\index.lock
```

Poi committa **solo** la webapp (così non tocchi le altre modifiche in corso):

```bat
git add webapp-client
git commit -m "feat(webapp-client): modalita demo per deploy Vercel"
git push
```

Vercel, una volta collegato, fa il re-deploy **automatico** ad ogni `git push`.

---

## Quando vorrai collegare il backend vero

Nel progetto Vercel → **Settings → Environment Variables**, aggiungi:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_DEMO` | `0` |
| `NEXT_PUBLIC_API_URL` | `https://api.nauticaglem.it` |

Poi **Redeploy**. Da quel momento login, colonnine, sessioni e wallet usano il
backend FastAPI reale invece dei dati demo. (Ricorda che il backend dovrà
accettare le richieste CORS dal dominio della webapp.)

---

## In caso di problemi

- **Pagina bianca / build fallita**: quasi sempre il *Root Directory* non è
  impostato su `webapp-client`. Controlla in Settings → General.
- **"Module not found"**: assicurati che il `git push` sia andato a buon fine e
  che il commit contenga `webapp-client/lib/demo.ts`.
- **Dati che non si azzerano**: la demo salva lo stato nel browser
  (localStorage). Per ripartire da zero: logout, oppure svuota i dati del sito.
