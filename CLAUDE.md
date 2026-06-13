# Nautica GLEM — Colonnine Smart Marina

## Cos'è questo progetto
Sistema IoT per la gestione delle colonnine elettriche di una marina (porto turistico).
Permette ai diportisti di ricaricare energia dai pontili tramite un wallet digitale con pagamenti Stripe.

---

## Architettura

| Layer | Tecnologia | Cartella |
|-------|-----------|---------|
| Firmware | ESP32 + MQTT TLS + WiFi mesh | `firmware/` |
| Backend API | FastAPI (Python) | `backend/` |
| Admin Dashboard | Next.js 14 | `dashboard-admin/` |
| Mobile App | Expo React Native | `mobile/` |
| DB | PostgreSQL + Alembic | `database/` |
| Deploy infra (design) | Docker Compose su Hetzner VPS | `docker-compose.yml` |

---

## Deploy attuale

### Dashboard Admin → Vercel (LIVE)
- **URL:** https://nautica-glem-colonnine.vercel.app
- **Repo GitHub:** https://github.com/Tropilax46/nautica-glem-colonnine
- Account Vercel: tropilax46's projects (Hobby)
- Root directory su Vercel: `dashboard-admin`
- Framework auto-rilevato: Next.js
- Ogni `git push` su `main` rideploya automaticamente

### Backend FastAPI → NON deployato
- Pensato per Hetzner VPS con Docker Compose
- `NEXT_PUBLIC_API_URL` va settato su Vercel env vars quando il backend è live

---

## Credenziali demo (login dashboard)

La dashboard usa un **mock login hardcoded** (nessun backend necessario):

| Campo | Valore |
|-------|--------|
| Email | `admin@nauticaglem.it` |
| Password | `admin1234` |

Il token salvato in localStorage è `"demo-token"`.
Quando il backend sarà deployato, ripristinare la chiamata reale in `dashboard-admin/pages/login.tsx`.

---

## Funzionalità dashboard admin

- **Dashboard** — KPI: ricavi, sessioni attive, energia erogata, utenti
- **Colonnine** — lista prese con stato real-time + pulsante Force OFF
- **Utenti** — ricerca + accredita wallet
- **Transazioni** — filtro per data + export CSV
- **Report** — grafici ricavi/sessioni
- **Impostazioni** — configurazione sistema

---

## File chiave

```
dashboard-admin/
  pages/
    login.tsx          ← mock login hardcoded (da ricollegare al backend)
    index.tsx          ← Dashboard KPI
    colonnine.tsx      ← gestione prese
    utenti.tsx         ← gestione utenti
    transazioni.tsx    ← storico pagamenti
  lib/
    api.ts             ← axios con base URL da NEXT_PUBLIC_API_URL
  next.config.js       ← output: "standalone", exposes NEXT_PUBLIC_API_URL
  .env.example         ← NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Variabili d'ambiente Vercel da settare quando il backend è live

```
NEXT_PUBLIC_API_URL=https://<tuo-dominio-backend>
```

---

## Comandi git

```bash
cd "C:\Users\Temp\Desktop\Geno\Nautica GLEM\Colonnine"
git add .
git commit -m "descrizione"
git push   # Vercel rideploya in automatico
```

---

## Prossimi passi suggeriti

1. Deploy backend FastAPI su Railway / Render / Hetzner
2. Configurare NEXT_PUBLIC_API_URL su Vercel
3. Ripristinare il login reale in `login.tsx`
4. Configurare Stripe webhook per i pagamenti
5. Deploy firmware ESP32 sui pontili fisici
