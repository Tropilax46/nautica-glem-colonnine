# Memoria progetto — webapp-client: modalità demo per Vercel
**Data:** 2026-06-14 · **Ambito:** `Colonnine/webapp-client/`

Documento di contesto: cosa è stato chiesto, deciso e fatto in questa sessione,
così da restare in memoria nel progetto.

---

## 1. Contesto di partenza
- Progetto **Nautica GLEM — Colonnine** (colonnine di ricarica per il molo).
  Componenti: `backend` (FastAPI), `dashboard-admin` (Next.js, già online su
  Vercel), `mobile-app` (Expo), `webapp-client` (Next.js, creata il 2026-06-12).
- La **dashboard-admin** gira su Vercel in *modalità demo*: login finto
  (`admin@nauticaglem.it` / `admin1234`, token in localStorage), pagine che
  chiamano comunque l'API reale (quindi su Vercel mostrano "—").
- Repo GitHub: **`Tropilax46/nautica-glem-colonnine`**, branch `main`.

## 2. Richiesta dell'utente
1. "Su `http://localhost:3001` non spunta nulla."
2. "Usa Vercel, il backend è già gestito così" → cioè: deploy come la
   dashboard-admin, **senza dipendere da un backend reale**.
3. "Riprenditi tutto da lì, guarda le ultime modifiche per contestualizzare."
4. (Follow-up) Salvare questa chat come memoria nel progetto.

## 3. Diagnosi
La `webapp-client` era completa ma **ogni pagina chiamava il backend FastAPI
reale**. Senza backend attivo (su `localhost:3001` e su Vercel) le fetch
fallivano → schermata vuota. Serviva una modalità demo autosufficiente.

## 4. Cosa è stato fatto (modifiche al codice)
- **NUOVO `lib/demo.ts`** — store mock in-memory persistito in `localStorage`
  (`glem_demo_state_v1`):
  - 5 colonnine demo (GLEM-A01/A02/B01/B02-offline/C01), tariffe 0.45–0.52 €/kWh.
  - Utente demo (Mario Rossi, barca "Santa Lucia"), saldo iniziale 25 €, 2 movimenti.
  - **Sessione di ricarica simulata live**: kWh = potenza(7.4 kW) × tempo
    trascorso, con cap opzionale `max_kwh`; costo = kWh × tariffa. Il polling
    delle pagine vede i numeri crescere davvero.
  - Endpoint simulati: `/auth/login`, `/auth/register`, `/users/me`,
    `/colonnine`, `/sessions` (POST/DELETE), `/sessions/active`, `/wallet`,
    `/wallet/topup` (ricarica immediata, niente Stripe reale).
  - `parseQr()` accetta codici tipo `GLEM-A03-P1` (e fallback per codici ignoti).
- **`lib/api.ts`** reso *demo-aware*: flag `DEMO = NEXT_PUBLIC_DEMO !== "0"`
  (demo ON di default). In demo le chiamate vanno al demo layer; con `DEMO=0`
  usano axios verso `NEXT_PUBLIC_API_URL`. Esportato `DEMO`.
- **`pages/login.tsx`**: banner "modalità demo" + campi precompilati; login con
  qualsiasi credenziale.
- **`pages/wallet.tsx`**: messaggio di conferma ricarica (`?topup=ok`).
- **`next.config.js`**: rimosso `output: standalone` e il blocco `env`
  ridondante (le `NEXT_PUBLIC_*` sono iniettate da Next in automatico).
- **`.env.example`**, **`README.md`** aggiornati; **NUOVO `GUIDA_VERCEL.md`**
  (deploy passo-passo).

Decisione chiave dell'architettura: la modalità è in `lib/api.ts`, i dati finti
in `lib/demo.ts`. **Tornare al backend reale = solo due variabili d'ambiente**,
nessuna modifica alle pagine.

## 5. Come si va online su Vercel
1. Sul PC: `rmdir /s /q webapp-client\node_modules`; se serve `del .git\index.lock`;
   poi `git add webapp-client` → `git commit` → `git push`.
2. Vercel → Add New → Project → repo `nautica-glem-colonnine` →
   **Root Directory = `webapp-client`** → Deploy. Nessuna env necessaria.
3. URL `*.vercel.app` → "Accedi" (qualsiasi credenziale). Dominio suggerito:
   `app.nauticaglem.it` (CNAME → `cname.vercel-dns.com`).

## 6. Passare al backend reale (futuro)
Variabili d'ambiente su Vercel: `NEXT_PUBLIC_DEMO=0` e
`NEXT_PUBLIC_API_URL=https://api.nauticaglem.it` → Redeploy. (Ricordarsi CORS lato
backend per il dominio della webapp.)

## 7. Verifiche e limiti noti della sessione
- Validata a runtime la logica di simulazione (parseQR, kWh, cap, costo,
  ricarica/scarico saldo): tutti i test passati.
- **Typecheck/build completo non eseguito in sandbox**: proxy troppo lento per
  scaricare `next`/`typescript` (stessa limitazione del 2026-06-12). Su PC
  `npm install && npm run dev` / build Vercel funzionano.
- **Git non eseguito dalla sandbox**: `.git/index.lock` (residuo del 2026-06-12)
  e un `node_modules` parziale risultano con permessi bloccati nella sandbox →
  commit/push da fare sul PC (vedi GUIDA_VERCEL.md).

## 8. Azioni ancora in capo all'utente
- [ ] Eliminare `webapp-client/node_modules` parziale e l'eventuale `.git/index.lock`.
- [ ] `git add webapp-client && git commit && git push`.
- [ ] Creare il progetto Vercel con Root Directory `webapp-client`.
- [ ] (Opzionale) collegare il dominio `app.nauticaglem.it`.
- [ ] (Futuro) passare al backend reale con le due env.

## 9. File toccati
```
webapp-client/lib/demo.ts          (nuovo)
webapp-client/lib/api.ts           (demo-aware)
webapp-client/pages/login.tsx      (banner demo)
webapp-client/pages/wallet.tsx     (conferma ricarica)
webapp-client/next.config.js       (semplificato)
webapp-client/.env.example         (DEMO + API_URL)
webapp-client/README.md            (riscritto)
webapp-client/GUIDA_VERCEL.md      (nuovo)
```
