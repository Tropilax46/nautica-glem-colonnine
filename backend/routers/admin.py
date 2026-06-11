"""Endpoint riservati al ruolo admin (dashboard operatore Nautica GLEM)."""
from datetime import datetime, timedelta, date
from io import StringIO
from decimal import Decimal
import csv

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import (
    User, UserRole, Colonnina, Presa, ChargeSession,
    SessionStatus, Ledger, LedgerType,
)
from .deps import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])


# ---------- Stats ----------

class TrendPoint(BaseModel):
    giorno: str
    kwh: float
    eur: float


class StatsOut(BaseModel):
    colonnine_totali: int
    colonnine_attive: int
    utenti_totali: int
    utenti_attivi_30d: int
    kwh_oggi: float
    ricavi_oggi_eur: float
    ricavi_mese_eur: float
    trend_30g: list[TrendPoint]


@router.get("/stats", response_model=StatsOut)
def stats(db: Session = Depends(get_db)):
    today = date.today()
    start_month = today.replace(day=1)
    start_30 = today - timedelta(days=30)

    col_tot = db.scalar(select(func.count()).select_from(Colonnina)) or 0
    col_on = db.scalar(
        select(func.count()).select_from(Colonnina).where(Colonnina.online.is_(True))
    ) or 0

    users_tot = db.scalar(select(func.count()).select_from(User)) or 0
    users_30 = db.scalar(
        select(func.count(func.distinct(ChargeSession.user_id))).where(
            ChargeSession.started_at >= start_30
        )
    ) or 0

    kwh_oggi = db.scalar(
        select(func.coalesce(func.sum(ChargeSession.kwh), 0)).where(
            func.date(ChargeSession.started_at) == today
        )
    ) or 0
    ricavi_oggi = db.scalar(
        select(func.coalesce(func.sum(-Ledger.delta_eur), 0)).where(
            Ledger.type == LedgerType.ENERGY,
            func.date(Ledger.created_at) == today,
        )
    ) or 0
    ricavi_mese = db.scalar(
        select(func.coalesce(func.sum(-Ledger.delta_eur), 0)).where(
            Ledger.type == LedgerType.ENERGY,
            func.date(Ledger.created_at) >= start_month,
        )
    ) or 0

    rows = db.execute(
        select(
            func.date(Ledger.created_at).label("g"),
            func.coalesce(func.sum(Ledger.kwh), 0).label("kwh"),
            func.coalesce(func.sum(-Ledger.delta_eur), 0).label("eur"),
        )
        .where(Ledger.type == LedgerType.ENERGY, Ledger.created_at >= start_30)
        .group_by("g")
        .order_by("g")
    ).all()
    trend = [TrendPoint(giorno=str(r.g), kwh=float(r.kwh), eur=float(r.eur)) for r in rows]

    return StatsOut(
        colonnine_totali=col_tot,
        colonnine_attive=col_on,
        utenti_totali=users_tot,
        utenti_attivi_30d=users_30,
        kwh_oggi=float(kwh_oggi),
        ricavi_oggi_eur=float(ricavi_oggi),
        ricavi_mese_eur=float(ricavi_mese),
        trend_30g=trend,
    )


# ---------- Colonnine ----------

class ColonninaAdmin(BaseModel):
    id: str
    nome: str
    posto_barca: str
    online: bool
    ultima_telemetria: datetime | None
    prese: list[dict]


@router.get("/colonnine", response_model=list[ColonninaAdmin])
def list_colonnine(db: Session = Depends(get_db)):
    # [I1] Fix: pre-carica tutte le sessioni attive in una sola query, evita N+1
    sessioni_attive = {
        (s.colonnina_id, s.presa_n): s
        for s in db.scalars(
            select(ChargeSession).where(ChargeSession.status == SessionStatus.ACTIVE)
        ).all()
    }

    out = []
    # [O2] eager-load delle prese: evita l'N+1 nel loop sottostante (1 query invece di 1+N)
    colonnine = db.scalars(
        select(Colonnina).options(joinedload(Colonnina.prese)).order_by(Colonnina.id)
    ).unique().all()
    for c in colonnine:
        prese = []
        for p in c.prese:
            sess = sessioni_attive.get((c.id, p.numero))
            prese.append({
                "numero": p.numero,
                "stato": "occupata" if p.in_use else "libera",
                "sessione_id": str(sess.id) if sess else None,
                "kwh_correnti": float(sess.kwh) if sess else 0,
            })
        posto = ((c.pontile or "") + " " + (c.posto or "")).strip()
        out.append(ColonninaAdmin(
            id=c.id,
            nome=c.label or c.id,
            posto_barca=posto,
            online=bool(c.online),
            ultima_telemetria=c.last_seen,
            prese=prese,
        ))
    return out


class ColonninaCreate(BaseModel):
    id: str
    label: str
    pontile: str | None = None
    posto: str | None = None
    tariff_eur: float = 0.55


@router.post("/colonnine")
def crea_colonnina(body: ColonninaCreate, db: Session = Depends(get_db)):
    if db.get(Colonnina, body.id):
        raise HTTPException(409, "id gia esistente")
    c = Colonnina(**body.model_dump())
    db.add(c)
    for n in (1, 2):
        db.add(Presa(colonnina_id=c.id, numero=n, qr_code=c.id + "-" + str(n)))
    db.commit()
    return {"ok": True, "id": c.id}


@router.post("/colonnine/{cid}/force-off")
def force_off(cid: str, db: Session = Depends(get_db)):
    """Pubblica MQTT cmd=off su entrambe le prese e marca le sessioni attive in stopping."""
    try:
        from mqtt_worker import publish_cmd  # type: ignore
    except Exception:
        publish_cmd = None  # type: ignore

    if not db.get(Colonnina, cid):
        raise HTTPException(404)
    for n in (1, 2):
        if publish_cmd:
            try:
                publish_cmd(cid, {"action": "off", "presa": n, "reason": "admin_force_off"})
            except Exception:
                pass
    db.query(ChargeSession).filter(
        ChargeSession.colonnina_id == cid,
        ChargeSession.status == SessionStatus.ACTIVE,
    ).update({ChargeSession.status: SessionStatus.STOPPING})
    db.commit()
    return {"ok": True}


# ---------- Utenti ----------

class UserAdmin(BaseModel):
    id: str
    nome: str
    email: str
    telefono: str | None
    barca: str | None
    saldo_eur: float
    creato_il: datetime


@router.get("/users", response_model=list[UserAdmin])
def list_users(q: str = "", db: Session = Depends(get_db)):
    qry = select(User)
    if q:
        like = "%" + q.lower() + "%"
        qry = qry.where(
            func.lower(User.email).like(like)
            | func.lower(User.full_name).like(like)
            | func.lower(User.boat_name).like(like)
        )
    rows = db.scalars(qry.order_by(User.created_at.desc()).limit(200)).all()
    return [
        UserAdmin(
            id=str(u.id),
            nome=u.full_name or "",
            email=u.email,
            telefono=u.phone,
            barca=u.boat_name,
            saldo_eur=float(u.wallet_eur or 0),
            creato_il=u.created_at,
        )
        for u in rows
    ]


class CreditBody(BaseModel):
    amount_eur: float = Field(gt=0, le=1000)
    causale: str = ""


@router.post("/users/{uid}/credit")
def accredita(uid: str, body: CreditBody, db: Session = Depends(get_db)):
    u = db.get(User, uid)
    if not u:
        raise HTTPException(404)
    # [O5] aritmetica monetaria con Decimal: coerente con la colonna Numeric(10,4)
    # e con il resto del backend (wallet.py / mqtt_worker), evita drift float sui soldi
    amount = Decimal(str(body.amount_eur))
    u.wallet_eur = (u.wallet_eur or 0) + amount
    db.add(Ledger(
        user_id=u.id,
        type=LedgerType.MANUAL_CREDIT,
        delta_eur=amount,
        note=body.causale,
    ))
    db.commit()
    return {"ok": True, "nuovo_saldo": float(u.wallet_eur)}


# ---------- Transazioni ----------

@router.get("/transactions")
def transactions(
    db: Session = Depends(get_db),
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
    format: str = "json",
):
    qry = select(Ledger, User).join(User, User.id == Ledger.user_id)
    if from_:
        qry = qry.where(Ledger.created_at >= datetime.fromisoformat(from_))
    if to:
        qry = qry.where(Ledger.created_at <= datetime.fromisoformat(to + "T23:59:59"))
    rows = db.execute(qry.order_by(Ledger.created_at.desc()).limit(5000)).all()

    # [O3] pre-carica in UNA query tutte le sessioni referenziate, evita l'N+1
    # (prima: fino a 5000 db.get(ChargeSession, ...) dentro il loop)
    session_ids = {l.session_id for l, _ in rows if l.session_id}
    sessioni = {}
    if session_ids:
        sessioni = {
            s.id: s
            for s in db.scalars(
                select(ChargeSession).where(ChargeSession.id.in_(session_ids))
            ).all()
        }

    data = []
    for ledger, user in rows:
        sess = sessioni.get(ledger.session_id) if ledger.session_id else None
        data.append({
            "id": ledger.id,
            "created_at": ledger.created_at.isoformat(),
            "user_email": user.email,
            "type": ledger.type.value.upper(),
            "kwh": float(ledger.kwh) if ledger.kwh is not None else None,
            "delta_eur": float(ledger.delta_eur),
            "colonnina_id": sess.colonnina_id if sess else None,
            "session_id": str(ledger.session_id) if ledger.session_id else None,
        })

    if format == "csv":
        buf = StringIO()
        fields = list(data[0].keys()) if data else ["id"]
        writer = csv.DictWriter(buf, fieldnames=fields)
        writer.writeheader()
        for row in data:
            writer.writerow(row)
        return Response(
            content=buf.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="transazioni.csv"'},
        )
    return data
