# Nautica GLEM — Colonnine Molo Smart

Progetto completo per rendere "smart" le colonnine del molo della Nautica GLEM e per costruire il gestionale che permette ai diportisti di prelevare energia tramite app con wallet prepagato.

## Stato di partenza
- Colonnine **già installate** sul molo, cavi (energia + acqua) **già passati**.
- Servizi attivi: **220 V monofase** + **acqua potabile**.
- Numero colonnine target: **30-80** (sensitivity in BOM_e_Budget).
- L'**acqua** resta come oggi; in questa fase rendiamo smart solo l'**erogazione elettrica**.

## Obiettivo MVP
1. Misurare i kWh per ogni presa, abilitare/disabilitare il prelievo da remoto.
2. App mobile per il diportista: registrazione, ricarica wallet, scan QR sulla colonnina, avvio prelievo, scollegamento, storico.
3. Dashboard web amministratore per Nautica GLEM: stato colonnine in tempo reale, utenti, transazioni, accrediti manuali, report mensili, export CSV.

## Stack scelto
| Livello | Tecnologia | Perché |
|---|---|---|
| Hardware retrofit | ESP32-WROOM-32**U** + antenna esterna IP67 + PZEM-004T + contattore 12V DC + driver MOSFET | Economico, ~114 €/colonnina; antenna esterna per superare la cassetta metallica |
| Comunicazione | MQTT TLS su WiFi 6 mesh **TP-Link Deco X50-Outdoor** → gateway 4G | Rete molo 100% wireless, nessun cablaggio dati alle colonnine |
| Backend | Python FastAPI + PostgreSQL + Redis | Veloce, type-safe, deploy semplice |
| Pagamenti | Stripe Checkout (wallet ricaricabile) | Compliance PCI gestita da Stripe |
| Mobile | Expo / React Native | Una codebase iOS + Android |
| Admin Web | Next.js 14 + Tailwind + Recharts | Stack moderno, ottima developer-experience |
| Infra | Docker Compose su VPS (Hetzner) | Costi contenuti, controllo totale |

## Struttura della cartella

```
Colonnine/
├── README.md                          # questo file — indice del progetto
├── BOM_e_Budget_NauticaGLEM.xlsx      # BOM + budget + sensitivity (apri in Excel)
│
├── docs/                              # documentazione progettuale (13 capitoli)
│   ├── 00-quickstart.md
│   ├── 01-architettura.md
│   ├── 02-hardware-bom.md             # ← AGGIORNATO v2
│   ├── 03-firmware-esp32.md
│   ├── 04-backend-api.md
│   ├── 05-database-schema.md
│   ├── 06-mobile-app.md
│   ├── 07-admin-dashboard.md
│   ├── 08-pagamenti-stripe.md
│   ├── 09-installazione.md
│   ├── 10-roadmap.md
│   ├── 11-budget-stima.md
│   ├── 12-sicurezza-normative.md
│   └── 13-faq-tecniche.md             # ← NUOVO: risposte alle domande progettuali
│
├── scripts/
│   └── build_bom_xlsx.py              # rigenera BOM_e_Budget_NauticaGLEM.xlsx
│
├── schemi/                            # tutti i diagrammi in Mermaid (.mmd)
│   ├── schema_elettrico_colonnina.mmd # cablaggio retrofit colonnina (v2.3)
│   ├── architettura_sistema.mmd       # diagramma di sistema end-to-end (v2.3)
│   ├── schema_elettrico_colonnina.svg # DEPRECATO (placeholder, vedi .mmd)
│   └── architettura_sistema.svg       # DEPRECATO (placeholder, vedi .mmd)
│
├── firmware/
│   └── colonnina_smart.ino            # firmware ESP32 (Arduino IDE / PlatformIO)
│
├── database/
│   └── schema.sql                     # DDL PostgreSQL
│
├── backend/                           # API FastAPI + worker MQTT
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── settings.py
│   ├── mqtt_worker.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   └── routers/
│       ├── auth.py
│       ├── users.py
│       ├── colonnine.py
│       ├── sessions.py
│       ├── wallet.py
│       └── admin.py                   # KPI, gestione utenti, force-off, export
│
├── dashboard-admin/                   # pannello operatore Next.js
│   ├── package.json
│   ├── next.config.js / tailwind.config.js / tsconfig.json / .env.example
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── login.tsx
│   │   ├── index.tsx                  # dashboard KPI + trend 30g
│   │   ├── colonnine.tsx              # stato live + Force OFF
│   │   ├── utenti.tsx                 # ricerca + accredito manuale
│   │   ├── transazioni.tsx            # filtro + export CSV
│   │   ├── report.tsx                 # grafici 12 mesi
│   │   └── impostazioni.tsx
│   ├── components/  (Layout, KpiCard)
│   ├── lib/api.ts
│   ├── styles/globals.css
│   └── README.md
│
└── mobile-app/                        # app diportista (Expo)
    ├── package.json
    ├── app.json
    ├── App.tsx
    ├── .env.example
    ├── src/
    │   ├── services/api.ts            # client Axios + tipi
    │   ├── services/auth.ts           # Zustand + SecureStore
    │   └── screens/
    │       ├── LoginScreen.tsx
    │       ├── RegisterScreen.tsx
    │       ├── HomeScreen.tsx
    │       ├── ColonninaDetailScreen.tsx
    │       ├── ScanScreen.tsx
    │       ├── SessionScreen.tsx      # WebSocket telemetria live
    │       ├── WalletScreen.tsx       # Stripe Checkout
    │       └── ProfileScreen.tsx
    └── README.md
```

## Come leggere il progetto
1. **Quadro economico** → apri `BOM_e_Budget_NauticaGLEM.xlsx` (sheet "Riepilogo budget" e "Sensitivity").
2. **Quadro tecnico** → `docs/01-architettura.md` + `schemi/architettura_sistema.mmd` (anteprima su https://mermaid.live).
3. **Per l'elettricista** → `schemi/schema_elettrico_colonnina.mmd` (export PNG da mermaid.live e stampa) + `docs/02-hardware-bom.md` + `docs/09-installazione.md`.
4. **Per lo sviluppatore** → parti da `docs/00-quickstart.md`, poi gli altri docs in ordine.

## Prossimi passi consigliati
1. **Pilota su 1 colonnina** — comprare 1 kit BOM (~200 €), retrofit, test 2 settimane sul molo con un utente fidato (Fase 0 in `docs/10-roadmap.md`).
2. **Backend + app + admin** — sviluppo (Fase 1+2 della roadmap). Stima ~21.000 € con freelance o 60-90 giorni interni.
3. **Roll-out** — quando il pilota è stabile, ordinare i 30-80 kit, programmare gli interventi (1 colonnina/ora, ~70 €/colonnina di manodopera).
4. **Bandi PNRR / Marina 4.0 / Transizione 5.0** — verificare prima dell'acquisto: potenzialmente coprono il 40-60% dell'investimento.

## Avvio rapido (sviluppo)

```bash
# Backend + DB + MQTT broker
cd backend && cp .env.example .env && docker compose up -d
# (la prima volta) python -m alembic upgrade head

# Dashboard admin
cd ../dashboard-admin && npm install && cp .env.example .env.local && npm run dev

# App mobile
cd ../mobile-app && npm install && cp .env.example .env && npx expo start
```

API Swagger: `http://localhost:8000/docs` — Dashboard: `http://localhost:3000` — Expo Go scanning QR.

## Sicurezza e responsabilità
- La realizzazione del retrofit elettrico deve essere eseguita o validata da **elettricista abilitato (DM 37/08)**.
- Tariffe e modalità di pagamento devono essere comunicate chiaramente nei termini di servizio (vedi `docs/12-sicurezza-normative.md`).
- I dati personali sono trattati secondo GDPR — registro trattamenti + privacy policy nei docs.

> Per qualunque dubbio: `docs/00-quickstart.md` ha l'ordine consigliato di lettura e le decisioni chiave da prendere prima di partire.
