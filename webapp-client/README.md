# Webapp client diportisti — Nautica GLEM

Webapp (Next.js 14 + Tailwind, mobile-first) per i clienti del molo. È l'equivalente web della mobile-app Expo.

Gira in **due modalità**:

- **Demo (default)** — funziona da sola, senza backend. Dati finti realistici, sessione di ricarica simulata in tempo reale. È la modalità con cui va su Vercel (come la dashboard-admin). Login con qualsiasi email/password.
- **Reale** — collegata al backend FastAPI. Si attiva con `NEXT_PUBLIC_DEMO=0` + `NEXT_PUBLIC_API_URL`.

## Funzionalità
- Login / registrazione (in demo basta premere *Accedi*)
- Lista colonnine con stato prese in tempo reale (refresh 10 s)
- Avvio prelievo con codice presa (es. `GLEM-A01-P1`)
- Sessione attiva live: kWh e costo che crescono (polling 5 s)
- Wallet: saldo, ricarica simulata, movimenti
- Profilo + logout

## Avvio in locale

Prerequisito: Node.js 18+.

```bash
cd webapp-client
npm install
npm run dev
```

Apri **http://localhost:3001**. In modalità demo non serve nessun backend.

## Deploy su Vercel

Vedi **GUIDA_VERCEL.md** (passo-passo). In sintesi: importi il repo su Vercel,
imposti *Root Directory* = `webapp-client`, e fai Deploy. Nessuna variabile
d'ambiente necessaria per la demo.

## Variabili d'ambiente

| Variabile | Default | A cosa serve |
|---|---|---|
| `NEXT_PUBLIC_DEMO` | `1` | `1` = demo senza backend · `0` = usa il backend reale |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL del backend FastAPI (solo se `DEMO=0`) |

## Passare al backend reale

1. Backend FastAPI raggiungibile (es. `https://api.nauticaglem.it`).
2. `.env.local` (o variabili Vercel):
   ```
   NEXT_PUBLIC_DEMO=0
   NEXT_PUBLIC_API_URL=https://api.nauticaglem.it
   ```
3. Le pagine tornano a usare gli endpoint reali. Mappa pagine ↔ endpoint:

| Pagina | Endpoint |
|---|---|
| /login | `POST /auth/login` |
| /register | `POST /auth/register` |
| / (colonnine) | `GET /colonnine`, `GET /users/me` |
| /avvia | `POST /sessions` |
| /sessione | `GET /sessions/active`, `DELETE /sessions/{id