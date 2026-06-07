# Daily Optimization Log — Nautica GLEM Colonnine

| Data       | Fix ID | File                        | Modifica                                                                 | Stato |
|------------|--------|-----------------------------|--------------------------------------------------------------------------|-------|
| 2026-05-31 | C1     | routers/sessions.py         | Spostato GET /active prima di DELETE /{session_id} — fix route conflict  | ✅    |
| 2026-05-31 | C2     | mqtt_worker.py              | Aggiunto guard `if not col` nel billing differenziale                    | ✅    |
| 2026-05-31 | C3     | routers/wallet.py           | Webhook Stripe idempotente: check su stripe_intent prima di accreditare  | ✅    |
| 2026-05-31 | C4     | main.py                     | `db.execute(text("SELECT 1"))` — fix SQLAlchemy 2.x raw SQL              | ✅    |
| 2026-05-31 | I1     | routers/admin.py            | list_colonnine: pre-fetch sessioni attive in 1 query, elimina N+1        | ✅    |
| 2026-05-31 | I2     | models.py + mqtt_worker.py  | `datetime.utcnow` → `datetime.now(timezone.utc)` — fix deprecation 3.12 | ✅    |
| 2026-05-31 | M1     | firmware/colonnina_smart.ino| Typo `colonnninaId` → `colonninaId` (4 occorrenze)                       | ✅    |
| 2026-06-06 | I2b    | routers/auth.py             | `_make_token`: `datetime.utcnow` → `datetime.now(timezone.utc)`           | ✅    |
| 2026-06-06 | ENV    | .gitignore                  | Aggiunto pattern `.~lock.*#` per i lock di LibreOffice/Excel             | ✅    |
|