-- =============================================================
-- Nautica GLEM — schema PostgreSQL
-- Genera le tabelle principali del gestionale.
-- In produzione preferire Alembic per le migrazioni.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Utenti ----------
CREATE TYPE user_role AS ENUM ('user','admin','operator');

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT,
  phone           TEXT,
  boat_name       TEXT,
  role            user_role DEFAULT 'user',
  wallet_eur      NUMERIC(10,4) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ---------- Colonnine ----------
CREATE TABLE colonnine (
  id            VARCHAR(32) PRIMARY KEY,        -- es. 'C-A-01'
  label         TEXT,
  pontile       TEXT,
  posto         TEXT,
  tariff_eur    NUMERIC(6,4),
  online        BOOLEAN DEFAULT FALSE,
  firmware      VARCHAR(32),
  last_seen     TIMESTAMPTZ,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE prese (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colonnina_id    VARCHAR(32) REFERENCES colonnine(id) ON DELETE CASCADE,
  numero          SMALLINT CHECK (numero IN (1,2)),
  qr_code         VARCHAR(64) UNIQUE NOT NULL,
  in_use          BOOLEAN DEFAULT FALSE,
  status          VARCHAR(20) DEFAULT 'idle'
);
CREATE INDEX idx_prese_qr ON prese (qr_code);

-- ---------- Sessioni ----------
CREATE TYPE session_status AS ENUM ('pending','active','stopping','ended','error');

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  colonnina_id    VARCHAR(32) REFERENCES colonnine(id),
  presa_n         SMALLINT,
  started_at      TIMESTAMPTZ DEFAULT now(),
  ended_at        TIMESTAMPTZ,
  kwh             NUMERIC(10,4) DEFAULT 0,
  cost_eur        NUMERIC(10,4) DEFAULT 0,
  status          session_status DEFAULT 'pending',
  last_kwh_meter  NUMERIC(10,4),
  max_kwh         NUMERIC(10,4)
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_open ON sessions(colonnina_id, presa_n)
  WHERE status IN ('pending','active','stopping');

-- ---------- Telemetria ----------
CREATE TABLE telemetry (
  id            BIGSERIAL PRIMARY KEY,
  session_id    UUID REFERENCES sessions(id),
  colonnina_id  VARCHAR(32),
  presa_n       SMALLINT,
  ts            TIMESTAMPTZ DEFAULT now(),
  voltage       REAL,
  current       REAL,
  power         REAL,
  kwh           REAL,
  pf            REAL
);
CREATE INDEX idx_tel_ts        ON telemetry(ts);
CREATE INDEX idx_tel_session   ON telemetry(session_id);
CREATE INDEX idx_tel_colonnina ON telemetry(colonnina_id, presa_n, ts DESC);
-- Consigliato: partizionare telemetry per mese (pg_partman) per gestire la
-- crescita dati (50 colonnine × 2 prese × 1 record/5s = ~350k record/giorno).

-- ---------- Ledger movimenti wallet ----------
CREATE TYPE ledger_type AS ENUM ('topup','energy','refund','credit');

CREATE TABLE ledger (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  session_id      UUID REFERENCES sessions(id),
  type            ledger_type,
  delta_eur       NUMERIC(10,4),
  kwh             NUMERIC(10,4),
  stripe_intent   TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ledger_user ON ledger(user_id, created_at DESC);
CREATE INDEX idx_ledger_stripe ON ledger(stripe_intent);  -- [O4] idempotenza webhook Stripe

-- ---------- Audit log ----------
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID,
  action      TEXT,
  entity      TEXT,
  entity_id   TEXT,
  metadata    JSONB,
  ip          INET,
  created_at  TIMESTAMPTZ DEFAULT now()
);
