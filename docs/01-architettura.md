# 01 — Architettura del sistema

## Vista d'insieme

```
┌────────────────┐     QR scan +     ┌─────────────────────┐
│  App Diportista│ ───── HTTPS ────▶ │   Backend FastAPI   │
│  (React Native)│ ◀──── push ────── │   (Python)          │
└────────────────┘                   │                     │
                                     │  ┌───────────────┐  │
┌────────────────┐                   │  │ PostgreSQL    │  │
│  Web Admin     │ ──── HTTPS ─────▶ │  │ Redis (cache) │  │
│  (Next.js)     │                   │  └───────────────┘  │
└────────────────┘                   │                     │
                                     │  MQTT broker        │
                                     │  (Mosquitto)        │
                                     └──────────┬──────────┘
                                                │ MQTT/TLS
                                                │
                                ┌───────────────┼──────────────────┐
                                │               │                  │
                          ┌─────┴─────┐  ┌──────┴────┐      ┌──────┴────┐
                          │ Colonnina │  │ Colonnina │  ... │ Colonnina │
                          │  #1 ESP32 │  │  #2 ESP32 │      │ #80 ESP32 │
                          └───────────┘  └───────────┘      └───────────┘
                                │                                  │
                          Router LTE 4G + access point WiFi al molo
```

## Componenti principali

### 1. Colonnina smart (modulo da inserire nella colonnina esistente)
Hardware aggiunto dentro al cassone della colonnina:
- **ESP32-WROOM-32** — micro con WiFi.
- **PZEM-004T v3.0** — misuratore di energia (V, A, W, kWh, cosφ) con TA 100A.
- **Contattore 25A 230V** comandato da relè 5V — abilita/disabilita la presa.
- **Alimentatore HiLink HLK-PM01** (220V→5V, 3W) — alimenta l'ESP32.
- **Pulsante d'emergenza meccanico** (in serie al contattore, indipendente dall'ESP32).
- **LED RGB di stato** — verde libera, blu in uso, rosso anomalia.
- **QR code adesivo** con ID univoco della colonnina.

Una colonnina spesso ha **2 prese** (porto/dritta della barca): il modulo controlla entrambe in modo indipendente, quindi 2 PZEM + 2 contattori per colonnina.

### 2. Rete al molo
- **Router LTE 4G industriale** (es. Teltonika RUT240) con SIM dati M2M.
- **Access Point WiFi outdoor** (es. Ubiquiti UniFi 6 Mesh) coprono il molo.
- ESP32 si connettono al WiFi del molo; il router fa da gateway verso Internet.
- Il broker MQTT può girare localmente sul router se necessario (modalità offline-tolerant).

### 3. Backend (cloud o VPS)
Servizi che girano in container Docker su un VPS:
- **API REST FastAPI** — espone endpoint a mobile app e web admin.
- **MQTT worker** — ascolta i messaggi delle colonnine, scrive nel DB, invia comandi.
- **PostgreSQL** — dati: utenti, colonnine, sessioni, transazioni.
- **Redis** — cache stato real-time, code di job, rate limiting.
- **Mosquitto** — broker MQTT con TLS.
- **NGINX** — reverse proxy HTTPS (Let's Encrypt).

### 4. App mobile (utente finale)
- React Native con Expo, distribuzione iOS + Android.
- Flusso: registra → ricarica wallet → scansiona QR → "Avvia prelievo" → tariffazione live → "Ferma".

### 5. Web admin (Nautica GLEM)
- Next.js: mappa molo con stato di ogni colonnina, gestione utenti, transazioni, report consumi mensili, esportazione CSV per contabilità.

## Flussi principali

### Flusso "prelievo energia"
1. Diportista apre l'app, scansiona QR della presa.
2. App invia `POST /sessions` con `colonnina_id`, `presa_id`, `user_id`.
3. Backend verifica wallet > soglia minima (es. 2 €), crea sessione `PENDING`.
4. Backend pubblica MQTT `colonnine/<id>/cmd` → `{"action":"on","presa":1,"session":"..."}`.
5. ESP32 chiude il contattore, accende LED blu, conferma su `colonnine/<id>/status`.
6. ESP32 pubblica ogni 5s `colonnine/<id>/telemetry` con V, A, W, kWh cumulati.
7. Backend addebita continuamente sul wallet (tariffa €/kWh + flat di apertura).
8. Utente preme "Ferma" → `DELETE /sessions/<id>` → backend manda MQTT off → ESP32 stacca → sessione chiusa.
9. Se wallet < soglia, backend stacca automaticamente e notifica push.

### Flusso "fail-safe"
- Se ESP32 perde connessione **e** ha una sessione attiva → continua a erogare ma logga i kWh in EEPROM e li sincronizza al ritorno della rete.
- Se ESP32 si riavvia con sessione "ghost" → al boot interroga il backend (`GET /colonnine/<id>/state`) e si sincronizza.
- Pulsante d'emergenza meccanico stacca SEMPRE (bypassa l'ESP32).

## Sicurezza
- **MQTT con TLS** + autenticazione client cert per colonnina.
- **API JWT** + refresh token per app.
- **Wallet** salvato in DB cifrato a riposo, transazioni Stripe (PCI gestita da Stripe).
- **Rate limit** su API pubbliche.
- **Differenziale 30 mA** + magnetotermico per ogni presa (è già normativa CEI 64-8/V3 per i pontili, dovrebbe esserci già).

Dettagli normativi: vedi `12-sicurezza-normative.md`.
