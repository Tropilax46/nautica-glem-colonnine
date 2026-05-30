# 06 — App mobile diportista

## Stack
- **React Native + Expo** (SDK 50)
- **TypeScript**
- **React Navigation** (stack + tab)
- **react-query** per chiamate API + cache
- **expo-camera** per scan QR
- **expo-notifications** push (FCM/APNs)
- **@stripe/stripe-react-native** per ricariche wallet
- **zustand** per stato globale (auth, wallet)

## Schermate

1. **Onboarding / Login** — email + password; in alternativa OTP via SMS.
2. **Registrazione** — nome, telefono, nome barca (opz).
3. **Home / Wallet** — saldo prominente, pulsante "Ricarica", pulsante "Scansiona QR".
4. **Scan QR** — anteprima camera + bordo guida.
5. **Conferma sessione** — colonnina + presa, tariffa €/kWh, "Imposta limite kWh" (opzionale), pulsante "Avvia prelievo".
6. **Sessione attiva** — kW istantanei, kWh erogati, costo €, tempo. Pulsante grosso rosso "Ferma".
7. **Riepilogo sessione** — al termine: kWh, costo finale, ricevuta scaricabile (PDF).
8. **Storico** — lista sessioni passate + filtro per mese.
9. **Ricariche** — flusso Stripe Checkout (PaymentSheet).
10. **Profilo** — dati personali, lingua (IT/EN), supporto.

## Flusso "primo prelievo" (happy path)

1. Apre app → Login.
2. "Ricarica wallet" → +20 €.
3. "Scansiona QR" → camera → punta sulla presa → riconosce `QR=xyz` → `GET /prese/by-qr/xyz`.
4. Schermata conferma: "Colonnina C-A-03 · Presa 1 · 0,55 €/kWh · saldo 20 €" → "Avvia".
5. POST /sessions → backend manda MQTT → contattore chiuso → LED blu.
6. Sessione attiva: dati live ogni 5 s via WebSocket.
7. "Ferma" → DELETE /sessions/{id} → confirm dialog → contattore aperto → riepilogo.

## Edge cases UX

| Caso | Comportamento |
|---|---|
| Wallet < 2 € all'avvio | Mostra modal "Ricarica almeno 2 € per iniziare". |
| Wallet < 0.30 € durante l'uso | Push: "Saldo basso, prelievo interrotto". |
| Presa già in uso da altro utente | "Presa occupata. Attendi che si liberi." |
| Connessione persa | Banner giallo "Riconnessione in corso…", la sessione resta attiva lato backend. |
| Backend manda `ALARM` (sovracorrente) | Push immediata + modal "Prelievo bloccato per sovraccarico, contatta capitaneria". |

## Distribuzione
- iOS: TestFlight → App Store (account Apple Developer 99 €/anno).
- Android: Google Play (25 € una tantum) o APK distribuito al porto via QR.

## Localizzazione
- Italiano (default) + Inglese (porto turistico).
- File JSON in `i18n/it.json` e `i18n/en.json`.

## Build & deploy
- EAS Build per binari → distribuzione canale `production` / `preview`.
- Sentry per crash report.
- Update OTA via Expo Updates (no review store per fix minori).
