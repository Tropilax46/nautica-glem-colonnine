# 03 — Firmware ESP32

## Scopo
Il firmware gestisce una colonnina con 2 prese. Funzioni:
1. Connessione WiFi + MQTT su TLS.
2. Lettura PZEM ogni 1s, pubblicazione telemetria ogni 5s.
3. Ricezione comandi `on/off` per presa.
4. LED di stato e gestione locale del pulsante d'emergenza.
5. Persistenza in NVS (flash) dello stato corrente e dei kWh non sincronizzati.
6. OTA update via HTTPS.

## Topic MQTT

| Topic | Direzione | Payload |
|---|---|---|
| `colonnine/<id>/status` | ESP32 → backend | `{"online":true,"firmware":"1.0.2","presa1":"idle","presa2":"erogating","uptime":12345}` |
| `colonnine/<id>/telemetry` | ESP32 → backend | `{"presa":1,"V":231.4,"A":4.2,"W":972,"kWh":0.421,"pf":0.99,"ts":1715000000}` |
| `colonnine/<id>/cmd` | backend → ESP32 | `{"action":"on","presa":1,"session":"abc123","max_kwh":10}` o `{"action":"off","presa":1}` |
| `colonnine/<id>/ack` | ESP32 → backend | `{"session":"abc123","result":"ok","presa":1}` |
| `colonnine/<id>/alarm` | ESP32 → backend | `{"type":"overcurrent","presa":2,"value":25.1}` |

## State machine (per presa)

```
        [IDLE]  ──cmd ON──▶  [STARTING] ──pzem ok──▶ [ERUGATING]
          ▲                       │                       │
          │                       │ pzem fail              │ cmd OFF / wallet kO / overcurrent
          │                       ▼                       ▼
          └────────────────── [FAULT] ◀──────────────── [STOPPING] ──contattore aperto──┐
                                                                                         │
                                                                                         ▼
                                                                                       [IDLE]
```

## Codice di partenza

File: `firmware/colonnina_smart.ino`

Vedere il file Arduino completo allegato in `firmware/`. Le scelte chiave:

- **Libreria PZEM:** `mandulaj/PZEM-004T-v30` (gestisce CRC e UART).
- **Libreria MQTT:** `PubSubClient` (stabile, leggero).
- **Libreria JSON:** `ArduinoJson` v6 (zero-copy).
- **OTA:** `ArduinoOTA` su rete locale + `httpUpdate` per OTA remoto.
- **Watchdog:** abilitato a 30 s, reset se loop si blocca.
- **WiFi credentials:** salvate in NVS, configurate al primo boot via captive portal (WiFiManager).

## Sicurezza firmware
- Comunicazione MQTT con **TLS 1.2** + certificato client per ogni colonnina.
- Firmware **firmato**: verifica SHA256 prima di applicare OTA.
- Nessuna porta di debug esposta in produzione.
- Reset di fabbrica solo con pulsante fisico interno + sequenza.

## Procedura di flash + bootstrap
1. Flash firmware base via cavo USB su banco.
2. Accendi → captive portal "ColonninaGLEM-XXXX" → l'installatore inserisce SSID/password WiFi del molo + ID colonnina.
3. La colonnina si registra al backend con `POST /colonnine/register` (token monouso fornito dall'admin), riceve cert client e topic MQTT.
4. Da quel momento sincronizza solo via MQTT.

## Test bench
Prima del rollout, fare 24h di test su banco:
- Carico resistivo da 1 kW per 24h: verificare deriva misurazione vs contatore di riferimento (<2%).
- Cicli di accensione/spegnimento ogni 10s per 1000 cicli: verificare contattore + relè SSR.
- Disconnessione WiFi: verificare che la presa resti accesa e che i kWh siano accumulati correttamente.
