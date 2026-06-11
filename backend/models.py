"""Modelli ORM."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, DateTime, Boolean, Float, Integer,
    ForeignKey, Enum, Text, JSON, Numeric,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import enum


# [I2] Fix: datetime.utcnow deprecato in Python 3.12+ → timezone-aware
def _now():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    OPERATOR = "operator"


class SessionStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    STOPPING = "stopping"
    ENDED = "ended"
    ERROR = "error"


class LedgerType(str, enum.Enum):
    TOPUP = "topup"          # ricarica
    ENERGY = "energy"        # addebito kWh
    REFUND = "refund"
    MANUAL_CREDIT = "credit"


class User(Base):
    __tablename__ = "users"
    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name     = Column(String(120))
    phone         = Column(String(32))
    boat_name     = Column(String(120))
    role          = Column(Enum(UserRole), default=UserRole.USER)
    wallet_eur    = Column(Numeric(10, 4), default=0)
    created_at    = Column(DateTime, default=_now)


class Colonnina(Base):
    __tablename__ = "colonnine"
    id            = Column(String(32), primary_key=True)        # es. "C-A-01"
    label         = Column(String(120))
    pontile       = Column(String(40))
    posto         = Column(String(40))
    tariff_eur    = Column(Numeric(6, 4))
    online        = Column(Boolean, default=False)
    firmware      = Column(String(32))
    last_seen     = Column(DateTime)
    note          = Column(Text)
    created_at    = Column(DateTime, default=_now)


class Presa(Base):
    __tablename__ = "prese"
    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    colonnina_id  = Column(String(32), ForeignKey("colonnine.id"))
    numero        = Column(Integer)                              # 1 o 2
    qr_code       = Column(String(64), unique=True, index=True)
    in_use        = Column(Boolean, default=False)
    status        = Column(String(20), default="idle")
    colonnina     = relationship("Colonnina", backref="prese")


class ChargeSession(Base):
    __tablename__ = "sessions"
    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    colonnina_id  = Column(String(32), ForeignKey("colonnine.id"))
    presa_n       = Column(Integer)
    started_at    = Column(DateTime, default=_now)
    ended_at      = Column(DateTime)
    kwh           = Column(Numeric(10, 4), default=0)
    cost_eur      = Column(Numeric(10, 4), default=0)
    status        = Column(Enum(SessionStatus), default=SessionStatus.PENDING)
    last_kwh_meter = Column(Numeric(10, 4))
    max_kwh       = Column(Numeric(10, 4))


class Telemetry(Base):
    __tablename__ = "telemetry"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    session_id    = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), index=True)
    colonnina_id  = Column(String(32), index=True)
    presa_n       = Column(Integer)
    ts            = Column(DateTime, default=_now, index=True)
    voltage       = Column(Float)
    current       = Column(Float)
    power         = Column(Float)
    kwh           = Column(Float)
    pf            = Column(Float)


class Ledger(Base):
    __tablename__ = "ledger"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    session_id    = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True)
    type          = Column(Enum(LedgerType))
    delta_eur     = Column(Numeric(10, 4))
    kwh           = Column(Numeric(10, 4))
    stripe_intent = Column(String(120), index=True)  # [O4] idempotenza webhook Stripe: lookup indicizzato
    note          = Column(Text)
    created_at    = Column(DateTime, default=_now)
