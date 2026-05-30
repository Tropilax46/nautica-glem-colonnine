# App mobile diportisti — Nautica GLEM

App Expo (React Native + TypeScript) per i clienti del molo.

## Flusso utente
1. Login / Registrazione (JWT, persistito in SecureStore).
2. Lista colonnine, stato prese in tempo reale.
3. Tap colonnina → vede tariffa e prese libere.
4. Avvia prelievo → scan QR sulla colonnina (l'URL del QR è `nauticaglem://colonnina/<id>?presa=<n>`).
5. Schermata "Sessione" in tempo reale (kWh, €, durata) via WebSocket `/ws/sessions/{id}`.
6. Stop manuale → addebito finale dal wallet prepagato.
7. Tab Wallet: saldo, ricarica via Stripe Checkout (apre browser → ritorna in app).

## Setup

```bash
cd mobile-app
npm install
cp .env.example .env   # imposta EXPO_PUBLIC_API_URL
npx expo start
```

Apri Expo Go sul telefono e scansiona il QR.

## Variabili d'ambiente
- `EXPO_PUBLIC_API_URL` — URL del backend FastAPI (es. `https://api.nauticaglem.it`).

## Build produzione
- iOS: `eas build -p ios` (account Apple Developer richiesto).
- Android: `eas build -p android` (`.aab` per Play Store).
- Configurare bundle ID `it.nauticaglem.app`.

## Permessi richiesti
- Fotocamera — per leggere il QR sulla colonnina.
- Geolocalizzazione — per ordinare la lista per distanza (opzionale).

## Mappa schermate ↔ endpoint backend
| Schermata | Endpoint |
|---|---|
| LoginScreen | `POST /auth/login` |
| RegisterScreen | `POST /auth/register` |
| HomeScreen | `GET /colonnine` |
| ColonninaDetailScreen | `GET /colonnine/{id}` |
| ScanScreen → SessionScreen | `POST /sessions` |
| SessionScreen | `WS /ws/sessions/{id}` + `DELETE /sessions/{id}` |
| WalletScreen | `GET /wallet`, `POST /wallet/topup` |
| ProfileScreen | `GET /users/me` |
