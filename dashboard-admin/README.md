# Dashboard amministratore — Nautica GLEM

Pannello operatore web (Next.js 14 + Tailwind + SWR + Recharts).

## Pagine
- `/login` — accesso operatore (ruolo `admin` su backend).
- `/` — dashboard KPI + trend 30 giorni.
- `/colonnine` — lista live (refresh 5 s), stato prese, "Force OFF" emergenza.
- `/utenti` — ricerca utenti, accredito manuale wallet.
- `/transazioni` — filtro per data, export CSV.
- `/report` — grafico 12 mesi (kWh + ricavi) + tabella.
- `/impostazioni` — tariffe globali, soglie.

## Setup
```bash
cd dashboard-admin
npm install
cp .env.example .env.local   # imposta NEXT_PUBLIC_API_URL
npm run dev                  # http://localhost:3000
```

## Deploy
- Build standalone: `npm run build && npm start`
- Oppure container Docker (`output: standalone` già configurato in `next.config.js`).
- Reverse proxy Nginx → terminate TLS → `/` proxy_pass al container.

## Auth
Il backend deve restituire `user.role === "admin"` al login. Non admin → 401 in dashboard.
JWT salvato in `localStorage["glem_admin_token"]`, scaduto → redirect `/login`.
