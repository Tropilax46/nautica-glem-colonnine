# 10 — Roadmap

Stima per un team **piccolo** (1 elettronico + 1 sviluppatore full-stack), part-time.

## Fase 0 — Prototipo (2-3 settimane)
**Obiettivo:** dimostrare che 1 colonnina può essere comandata da app.

- [ ] Acquistare kit pilota (ESP32, PZEM, contattore, alimentatore) — ~150 €.
- [ ] Sviluppare firmware base (accendi/spegni + leggi PZEM + MQTT verso Mosquitto locale).
- [ ] Backend minimo: 1 endpoint `POST /sessions` + worker MQTT.
- [ ] Mobile: schermata con un pulsante "Accendi/Spegni" hardcoded.
- [ ] Test su banco a casa o in officina.

## Fase 1 — MVP (6-8 settimane)
**Obiettivo:** flusso end-to-end completo, installazione su 2 colonnine pilota in marina.

- [ ] Schema DB completo + migrazioni Alembic.
- [ ] Auth utente (registrazione, login, JWT).
- [ ] Wallet + integrazione Stripe (ricariche).
- [ ] Flusso completo "scan QR → conferma → eroga → ferma → addebito".
- [ ] WebSocket per live data in app.
- [ ] Pannello admin v1: lista colonnine + sessioni attive.
- [ ] Build app iOS/Android (TestFlight / interno).
- [ ] Sopralluogo + installazione 2 colonnine pilota.
- [ ] Test in marina con 3-5 utenti reali per 2 settimane.

## Fase 2 — Rollout (4-6 settimane)
**Obiettivo:** scalare a tutte le colonnine.

- [ ] Procurement materiale per N colonnine.
- [ ] Installazione progressiva (10 colonnine/settimana con elettricista esterno).
- [ ] Pannello admin v2: mappa molo + report + export CSV.
- [ ] App store release (pubblica iOS + Android).
- [ ] Materiale marketing: targhe colonnina, locandina al porto, banner sul sito.
- [ ] Formazione del personale della Nautica GLEM (manuale operativo).

## Fase 3 — Consolidamento (continuo)
- [ ] Monitoraggio (Grafana + Prometheus) per allarmi infrastrutturali.
- [ ] OTA firmware automatico.
- [ ] Aggregazione storica telemetria → riduzione storage DB.
- [ ] App: multilingua (EN), notifiche push avanzate.
- [ ] Backup automatico off-site giornaliero.

## Fase 4 — Evoluzioni future (idee)
- [ ] Smart contracts dei posti barca (rinnovo automatico, fattura elettronica).
- [ ] Rendere smart anche l'**acqua** (richiede contatori MID DN15 + elettrovalvole, ~80 €/colonnina extra).
- [ ] Dynamic pricing: tariffe diverse per fascia oraria (es. di notte più economico).
- [ ] Integrazione con software gestionale del porto (Mooring, Marina2000, GPP).
- [ ] Sostituzione PZEM con contatore MID per **fatturazione certificata kWh**.
- [ ] Programma fedeltà: dopo 100 € spesi → 5 € omaggio.

## Diagramma Gantt riassuntivo

```
Settimana       1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
Fase 0 prototipo ███████
Fase 1 MVP            ████████████████████
Fase 2 rollout                            ████████████████
Fase 3 consolidam.                                          ──── continuo ────▶
```
