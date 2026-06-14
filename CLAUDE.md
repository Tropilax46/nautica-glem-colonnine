# Nautica GLEM — Colonnine Smart Marina

## Cos'è questo progetto
Sistema IoT per la gestione delle colonnine elettriche di una marina. I diportisti
ricaricano energia dai pontili tramite un wallet a crediti; l'admin gestisce utenti,
colonnine, transazioni e può entrare come un utente per assistenza.

---

## Architettura ATTUALE (dati reali, no mock)

| Layer | Tecnologia | Dove |
|-------|-----------|------|
| Database + Auth + API | **Supabase** (Postgres gestito) | progetto `nautica-glem` (`suptzhugjpppcxpblcov`, eu-central-1) |
| Webapp cliente (diportisti) | Next.js 14 | Vercel `nautica-glem-app` → https://nautica-glem-app.vercel.app |
| Dashboard admin | Next.js 14 | Vercel `nautica-glem-colonnine` → https://nautica-glem-colonnine.vercel.app |
| Impersonazione | Supabase Edge Function `impersonate` | (service_role lato server) |
| Firmware (futuro) | ESP32 + MQTT | `firmware/` |
| Backend FastAPI (legacy, NON usato) | FastAPI | `backend/` — sostituito da Supabase |

Repo GitHub: `Tropilax46/nautica-glem-colonnine`, branch `main`. Ogni push rideploya
entrambi i progetti Vercel (Root Directory rispettive: `webapp-client`, `dashboard-admin`).

---

## Supabase

- **URL:** `https://suptzhugjpppcxpblcov.supabase.co`
- **anon key:** pubblica (incorporata nel frontend come default; protetta da RLS).
- **service_role key:** MAI nel frontend — usata solo dalla Edge Function `impersonate`
  (Supabase la inietta automaticamente).

### Schema (`public`)
- `profiles` (1:1 con `auth.users`): id, email, full_name, phone, boat_name,
  `role` ('diportista'|'admin'|'operatore'), `wallet_eur`, created_at.
  Profilo creato automaticamente alla registrazione (trigger `handle_new_user`).
- `colonnine`: id (es. `GLEM-A01`), nome, posto_barca, tariffa_eur_kwh, potenza_kw,
  num_prese, online.
- `sessions`: sessioni di ricarica (user, colonnina, presa, kwh, cost_eur, status).
- `movimenti`: ledger wallet (topup / charge / admin_credit).

### Funzioni RPC (SECURITY DEFINER)
`start_session(p_qr, p_max_kwh)`, `stop_session(p_session_id)`, `topup(p_amount)`,
`admin_accredita(p_user, p_amount)`, `colonnine_stato()`, `my_active_session()`, `is_admin()`.

### RLS
Diportista vede/gestisce solo i propri dati; admin vede tutto. Colonnine in lettura a
tutti gli autenticati. Scritture sensibili (wallet/sessioni) solo via RPC.

### DEMO settings da rivedere in produzione
- Trigger `auto_confirm_email`: auto-conferma le email alla registrazione (no click su
  email). In produzione: rimuovere e abilitare la conferma email reale in Auth.
- kWh sessione: ancora simulati dal tempo (potenza × durata) finché l'hardware ESP32 non
  invia letture reali via MQTT.

---

## Account
- **Admin:** `admin@nauticaglem.it` (password consegnata separatamente — CAMBIARLA).
- **Diportisti di test:** `mario.rossi@example.com`, `giulia.bianchi@example.com`.
- Login admin verifica `role='admin'`; un diportista non può entrare nel pannello admin.

## Impersonazione ("Entra come utente")
Dashboard admin → Utenti → "Entra come utente": chiama la Edge Function `impersonate`
(verifica che il chiamante sia admin), che genera una sessione per l'utente target e la
restituisce; il pulsante apre `webapp-client/impersona#at=…&rt=…` in una nuova scheda,
già loggata come quell'utente. La service_role key resta sempre lato server.

---

## Comandi git
```bash
cd "<repo>/Colonnine"
git add . && git commit -m "msg" && git push   # Vercel rideploya entrambe le app
```
(In ambiente Cowork sandbox usare la procedura di push "a prova di lock" — index
alternativo via `mktemp`, vedi handoff.)

## Prossimi passi
1. Cambiare la password admin; in produzione abilitare conferma email reale.
2. Collegare domini custom (es. `app.nauticaglem.it`, `admin.nauticaglem.it`).
3. Integrare Stripe reale per il top-up del wallet (ora il top-up è immediato/simulato).
4. Firmware ESP32 → MQTT → aggiornare `sessions.kwh` con letture reali.
