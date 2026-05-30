# 07 — Web Admin (Nautica GLEM)

## Stack
- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** + **shadcn/ui**
- **TanStack Query** per fetching
- **Recharts** per i grafici
- **MapLibre GL** per la pianta del molo (interattiva)
- **Auth:** stesso JWT del backend (ruolo `admin`/`operator`)

## Sezioni

### 1. Dashboard
- KPI in alto: colonnine online / totali, sessioni attive ora, kWh oggi, ricavi oggi, ricavi mese, utenti registrati.
- Grafico "kWh erogati ultimi 30 giorni".
- Tabella "Sessioni attive in questo momento".
- Alert se ≥1 colonnina offline da >5 minuti.

### 2. Mappa molo
- Pianta del molo (immagine SVG o mappa MapLibre).
- Ogni colonnina è un pin colorato: verde libera, blu in uso, grigio offline, rosso allarme.
- Click su un pin → drawer con dettaglio + comandi (force-off, manutenzione).

### 3. Colonnine
- Tabella con `id`, pontile/posto, stato, firmware, ultima vista, tariffa, prese in uso.
- Azioni di massa: aggiorna tariffa, OTA firmware, metti in manutenzione.

### 4. Utenti
- Lista utenti + filtri (saldo > X, sessioni > Y, ultimo accesso).
- Drawer con: dati, saldo, storico sessioni, pulsante "Accredita manualmente".

### 5. Transazioni
- Ledger filtrabile per data, tipo (ricarica/energia/rimborso), utente, colonnina.
- Export CSV per la commercialista.

### 6. Report
- Report mensile: totale kWh erogati, ricavi, ricariche, utenti attivi.
- Confronto mese su mese.
- Export PDF.

### 7. Impostazioni
- Tariffa base €/kWh.
- Soglie wallet.
- Gestione operatori e ruoli.
- Configurazione SMTP (per email di reset password).
- Test connessione Stripe / MQTT.

## Permessi

| Ruolo | Vista | Azioni |
|---|---|---|
| `admin` | tutto | tutto (incl. cambio tariffe, accrediti manuali, gestione utenti) |
| `operator` | dashboard, mappa, sessioni attive | force-off, segnalare manutenzione |

## Esempio struttura cartelle (Next.js)

```
admin/
├── app/
│   ├── (dashboard)/page.tsx
│   ├── colonnine/page.tsx
│   ├── colonnine/[id]/page.tsx
│   ├── utenti/page.tsx
│   ├── transazioni/page.tsx
│   ├── mappa/page.tsx
│   ├── report/page.tsx
│   └── impostazioni/page.tsx
├── components/
├── lib/api.ts       # client tipizzato verso il backend
├── lib/auth.ts
└── tailwind.config.ts
```
