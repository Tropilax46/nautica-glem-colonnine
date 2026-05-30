# 00 — Quickstart per chi prende in mano il progetto

> Da dove iniziare se hai 1 ora per capire il progetto.

## In 5 minuti — il contesto
- Molo della Nautica GLEM con 30-80 colonnine già installate (220V + acqua).
- Obiettivo: rendere smart la parte elettrica e farla pagare via app.
- Diportista: scarica app, ricarica wallet, scansiona QR sulla presa, eroga, paga.
- Nautica GLEM: pannello web per monitorare e incassare.

## In 30 minuti — leggi questi 4 file in ordine
1. `README.md` — visione d'insieme e stack scelto.
2. `docs/01-architettura.md` — come tutto si connette.
3. `docs/02-hardware-bom.md` — cosa comprare e quanto costa.
4. `docs/10-roadmap.md` — in quanto tempo si fa.

## In 1 ora — cosa fare subito
1. Comprare **un solo kit pilota** (~150 € — vedi BOM in `02`).
2. Aprire la cartella `firmware/` e flashare l'ESP32.
3. Avviare il backend in locale (Docker Compose veloce — istruzioni in `04`).
4. Fare il primo "accendi/spegni" da terminale via MQTT → da app.
5. **Solo dopo** che il prototipo funziona su banco, sopralluogo al molo.

## Decisioni già prese (non da rimettere in discussione senza motivo)

| Tema | Decisione | File |
|---|---|---|
| Solo elettrico nello smart, acqua resta com'è | confermata con il committente | — |
| Wallet prepagato con Stripe | pagamento più semplice / meno commissioni | `08` |
| ESP32 + PZEM-004T per il retrofit | miglior rapporto qualità/prezzo | `02` |
| FastAPI + PostgreSQL | stack noto, scalabile, semplice deploy | `04` |
| React Native (Expo) per la mobile | una codebase, OTA updates | `06` |
| Next.js + Tailwind per l'admin | onboarding rapido, ottime librerie | `07` |

## Decisioni ancora da prendere (per il committente)
- [ ] Numero esatto di colonnine da convertire (entro range 30-80).
- [ ] Tariffa €/kWh definitiva.
- [ ] Vuoi anche emissione **fattura elettronica** automatica? (richiede integrazione Fatture in Cloud / Aruba).
- [ ] Sviluppo software in casa, freelance o agenzia? (vedi `11`).
- [ ] Vuoi mantenere il vecchio sistema (se esiste) come fallback durante il rollout?

## Chi fa cosa (ruoli)
- **Committente (Nautica GLEM)** → decide tariffe, fornisce piantina molo, sopralluogo.
- **Elettricista** → installazione fisica dei moduli retrofit, DiCo (DM 37/08).
- **Sviluppatore** → firmware, backend, mobile, admin, infrastruttura cloud.
- **Commercialista** → fatturazione, agevolazioni 4.0 / bandi PNRR (vedi `11`).
