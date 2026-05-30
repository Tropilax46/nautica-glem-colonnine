# 05 — Schema database

Lo script SQL completo è in `database/schema.sql`.

## Tabelle principali

| Tabella | Scopo |
|---|---|
| `users` | Diportisti + ruoli (utente/admin/operator). Contiene `wallet_eur` denormalizzato per consultazione veloce, ma la verità è nel `ledger`. |
| `colonnine` | Anagrafica fisica delle colonnine. `id` testuale leggibile (`C-A-01`). |
| `prese` | Una riga per presa (di norma 2 per colonnina). Contiene il `qr_code` univoco stampato sulla presa. |
| `sessions` | Ogni prelievo di energia genera una sessione. Stato + totali kWh / costo. |
| `telemetry` | Letture istantanee del PZEM (~ ogni 5s). Partizionata per mese, ritenzione 90 giorni → poi aggregata. |
| `ledger` | Movimenti del wallet (ricariche, addebiti, rimborsi). È la fonte di verità. |
| `audit_log` | Tracciamento azioni amministrative. |

## Politiche di ritenzione e aggregazione

- `telemetry` cresce molto: a regime, con 80 colonnine × 2 prese × 1 record / 5s = ~2.7 M record/giorno. Ritenzione raw 90 giorni con `pg_partman`, oltre è aggregato in `telemetry_5m` (medie ogni 5 minuti) per il grafico storico nel pannello admin.
- `ledger` è immutabile (append-only). Backup giornaliero off-site.
- `users.wallet_eur` è ricalcolato ogni notte come `SUM(ledger.delta_eur)` per verificarne la consistenza.

## Indici critici

- `idx_sessions_open` indice parziale per trovare velocemente le sessioni aperte (in MQTT worker).
- `idx_prese_qr` per scan QR dall'app.
- `idx_tel_colonnina (colonnina_id, presa_n, ts DESC)` per visualizzare l'ultima telemetria.

## Migrazioni

Tutte le modifiche di schema **dopo** il primo deploy passano da Alembic.

```bash
alembic revision -m "add tariff_groups"
alembic upgrade head
```
