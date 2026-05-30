# 04 — Backend API

## Stack
- **FastAPI** (Python 3.11) — API REST + WebSocket per stato real-time.
- **SQLAlchemy 2** + **Alembic** — ORM e migrazioni.
- **PostgreSQL 15** — database principale.
- **Redis 7** — cache, pub/sub, locking.
- **Mosquitto** — broker MQTT.
- **paho-mqtt** — worker MQTT in processo separato.
- **Stripe SDK** — pagamenti.

## Struttura del progetto

```
backend/
├── main.py                 # FastAPI app + router
├── database.py             # engine + sessione SQLAlchemy
├── models.py               # modelli ORM
├── schemas.py              # Pydantic
├── routers/
│   ├── auth.py
│   ├── users.py
│   ├── colonnine.py
│   ├── sessions.py
│   ├── wallet.py
│   └── admin.py
├── mqtt_worker.py          # consuma MQTT, scrive in DB
├── billing.py              # logica addebito kWh → wallet
├── stripe_webhooks.py
├── requirements.txt
└── .env.example
```

## Endpoint principali

### Auth / utenti
| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/auth/register` | Registra utente (email, password, nome, telefono, n. barca) |
| POST | `/auth/login` | Restituisce JWT (15') + refresh (30d) |
| POST | `/auth/refresh` | Rinnova JWT |
| POST | `/auth/forgot-password` | Email di reset |
| GET  | `/users/me` | Dati utente loggato |
| PATCH| `/users/me` | Aggiorna dati |

### Colonnine (lato utente)
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET  | `/colonnine` | Elenco colonnine + stato pubblico |
| GET  | `/colonnine/{id}` | Dettaglio colonnina, prese disponibili |
| POST | `/sessions` | Avvia sessione `{colonnina_id, presa, max_kwh?}` |
| GET  | `/sessions/active` | Sessioni attive dell'utente |
| GET  | `/sessions/{id}` | Dettaglio sessione |
| DELETE | `/sessions/{id}` | Ferma sessione |
| WS   | `/ws/sessions/{id}` | Stream telemetria live |

### Wallet
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET  | `/wallet` | Saldo + movimenti |
| POST | `/wallet/topup` | Crea Stripe Checkout Session |
| POST | `/webhooks/stripe` | Webhook Stripe (firmato) |

### Admin (ruolo `admin`)
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET  | `/admin/colonnine` | Tutte le colonnine + stato dettagliato |
| POST | `/admin/colonnine` | Registra nuova colonnina |
| PATCH| `/admin/colonnine/{id}` | Tariffa, stato manutenzione |
| POST | `/admin/colonnine/{id}/force-off` | Stop forzato |
| GET  | `/admin/users` | Elenco utenti |
| POST | `/admin/users/{id}/credit` | Accredita manualmente al wallet |
| GET  | `/admin/transactions` | Esporta transazioni (CSV) |
| GET  | `/admin/stats` | KPI per dashboard |

## Modelli Pydantic principali (estratto)

```python
class SessionCreate(BaseModel):
    colonnina_id: str
    presa: Literal[1, 2]
    max_kwh: float | None = None

class SessionRead(BaseModel):
    id: UUID
    colonnina_id: str
    presa: int
    user_id: UUID
    started_at: datetime
    ended_at: datetime | None
    kwh: float
    cost_eur: float
    status: Literal["pending", "active", "stopping", "ended", "error"]
```

## Logica di billing

Worker MQTT, alla ricezione di un messaggio `telemetry` di una presa con sessione attiva:

```text
delta_kwh = kwh_attuale - kwh_ultima_lettura
costo_eur = delta_kwh * tariffa_eur_per_kwh + flat_eventuale (solo prima lettura)
wallet -= costo_eur
INSERT INTO ledger (user_id, session_id, type='ENERGY', delta_eur=-costo_eur, kwh=delta_kwh)

se wallet < soglia_minima:
    pubblica MQTT off → stop sessione → notifica push utente
```

Tariffe configurabili per colonnina (per ora flat unica): `tariffa_eur_per_kwh = 0.55`.

## File pronti
- `backend/main.py` — bootstrap FastAPI.
- `backend/database.py` — connessione PostgreSQL.
- `backend/models.py` — schema ORM iniziale.
- `backend/mqtt_worker.py` — worker MQTT base.
- `backend/requirements.txt` — dipendenze.
- `backend/.env.example` — variabili d'ambiente.

Per avviare in locale:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # poi modifica
alembic upgrade head
uvicorn main:app --reload &
python mqtt_worker.py
```
