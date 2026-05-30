# 09 — Procedura di installazione

## Sopralluogo (prerequisito)
Prima di ordinare materiale, fare un sopralluogo per ogni colonnina:
1. Foto interno cassone + targa.
2. Verifica presenza differenziale 30 mA e magnetotermici per ogni presa.
3. Misura spazio disponibile per cassetta retrofit (~ 15×10×7 cm).
4. Misura segnale WiFi (con cellulare in modalità "site survey").
5. Nota numero presa esistente e tipo (CEE 16A / Schuko).

Compilare il foglio Excel `survey_colonnine.xlsx` (template generabile dal backend dopo prima installazione).

## Installazione singola colonnina (~ 1 h)

⚠️ **Pre-condizione di sicurezza:** togliere tensione al quadro del pontile + verificare assenza tensione con cercafase. Lavorare in 2 persone, una a vigilare.

1. Aprire il cassone della colonnina.
2. Fissare la cassettina retrofit IP65 con il modulo ESP32 + relè SSR su DIN rail laterale.
3. Far passare le 2 fasi delle prese attraverso il TA dei rispettivi PZEM.
4. Collegare le bobine dei contattori K1, K2 ai relè SSR.
5. Collegare l'alimentatore HLK-PM01 a monte (sempre alimentato).
6. Collegare LED RGB di stato sulla parte alta della colonnina (ben visibile dal pontile).
7. Applicare adesivo QR sopra a ogni presa.
8. Richiudere il cassone, ripristinare tensione.
9. **Bootstrap firmware:** vedi sotto.

## Bootstrap della colonnina (firmware → backend)
1. Connettersi con telefono al WiFi della colonnina (`ColonninaGLEM-XXXX`).
2. Browser apre captive portal.
3. Compilare:
   - WiFi SSID + password del molo.
   - ID colonnina (es. `C-A-03`).
   - Token monouso (generato dal pannello admin: "+ Nuova colonnina").
4. Salva → la colonnina si riavvia, si registra al backend, scarica i certificati.
5. Dal pannello admin compare la colonnina ONLINE.
6. Eseguire il **test di collaudo**: attivare presa 1 con carico da 1 kW noto (es. asciugacapelli), confrontare con misuratore di riferimento; ripetere su presa 2.

## Test di accettazione (checklist)

- [ ] Colonnina compare ONLINE nel pannello admin entro 1 minuto dal boot.
- [ ] LED verde quando entrambe le prese idle.
- [ ] Attivando una presa, LED diventa blu.
- [ ] Telemetria visibile nel pannello admin (V, A, W, kWh).
- [ ] Pulsante emergenza fisico stacca entrambe le prese (test manuale).
- [ ] Spegnimento WiFi temporaneo: la sessione attiva continua, al ritorno della rete i kWh sono sincronizzati correttamente.
- [ ] Test sovracorrente simulato → ESP32 stacca + invia allarme.

## Targhetta sulla colonnina (obbligatoria)
Stampare e applicare una targhetta plastificata con:
- ID colonnina.
- QR per scaricare l'app.
- Numero verde Nautica GLEM in caso di problemi.
- Tariffa €/kWh corrente (può essere QR che porta al pricing online così non va aggiornata fisicamente).
