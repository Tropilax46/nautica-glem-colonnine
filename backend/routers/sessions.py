"""Sessioni di prelievo energia."""
import json
from decimal import Decimal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Literal
from database import get_db
from models import User, Colonnina, ChargeSession, SessionStatus, Presa
from settings import settings
from .deps import current_user
import paho.mqtt.publish as mqtt_publish

router = APIRouter()


class StartSessionIn(BaseModel):
    qr_code: str
    max_kwh: float | None = None


class SessionOut(BaseModel):
    id: UUID
    colonnina_id: str
    presa_n: int
    status: SessionStatus
    kwh: float
    cost_eur: float

    class Config: from_attributes = True


@router.post("", response_model=SessionOut)
def start(body: StartSessionIn,
          user: User = Depends(current_user),
          db: Session = Depends(get_db)):
    presa = db.query(Presa).filter_by(qr_code=body.qr_code).first()
    if not presa:
        raise HTTPException(404, "QR sconosciuto")
    if presa.in_use:
        raise HTTPException(409, "presa già in uso")
    if (user.wallet_eur or 0) < Decimal(str(settings.min_wallet_to_start_eur)):
        raise HTTPException(402, f"saldo wallet insufficiente, minimo "
                                  f"{settings.min_wallet_to_start_eur} EUR")

    sess = ChargeSession(
        user_id=user.id,
        colonnina_id=presa.colonnina_id,
        presa_n=presa.numero,
        status=SessionStatus.PENDING,
        max_kwh=body.max_kwh,
    )
    # [O3] singolo commit: presa.in_use settato nella stessa transazione,
    # evita un secondo round-trip al DB (id disponibile via default uuid4 lato Python)
    presa.in_use = True
    db.add(sess); db.commit(); db.refresh(sess)

    # Invia comando MQTT
    mqtt_publish.single(
        topic=f"colonnine/{presa.colonnina_id}/cmd",
        payload=json.dumps({
            "action": "on",
            "presa": presa.numero,
            "session": str(sess.id),
            "max_kwh": body.max_kwh or 0,
        }),
        hostname=settings.mqtt_host, port=settings.mqtt_port,
        auth={"username": settings.mqtt_user, "password": settings.mqtt_pass},
    )
    return sess


# [C1] Fix: /active registrato PRIMA di /{session_id} per evitare che FastAPI
# catturi "active" come UUID e restituisca 422.
@router.get("/active", response_model=list[SessionOut])
def active(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return (db.query(ChargeSession)
              .filter(ChargeSession.user_id == user.id,
                      ChargeSession.status.in_([SessionStatus.PENDING,
                                                SessionStatus.ACTIVE,
                                                SessionStatus.STOPPING]))
              .all())


# [O8] Fix: aggiunto GET /sessions/{session_id} (read-only). L'app mobile
# (SessionScreen -> Api.getSession) faceva polling su questa rotta che non
# esisteva nel backend -> 405/404 e dettaglio sessione mai caricato. Stesso
# controllo di ownership della DELETE. Registrato DOPO /active (vedi [C1]) cosi
# "active" non viene interpretato come UUID.
@router.get("/{session_id}", response_model=SessionOut)
def get_one(session_id: UUID,
            user: User = Depends(current_user),
            db: Session = Depends(get_db)):
    sess = db.get(ChargeSession, session_id)
    if not sess or sess.user_id != user.id:
        raise HTTPException(404)
    return sess


@router.delete("/{session_id}", response_model=SessionOut)
def stop(session_id: UUID,
         user: User = Depends(current_user),
         db: Session = Depends(get_db)):
    sess = db.get(ChargeSession, session_id)
    if not sess or sess.user_id != user.id:
        raise HTTPException(404)
    if sess.status in (SessionStatus.ENDED, SessionStatus.ERROR):
        return sess
    sess.status = SessionStatus.STOPPING
    db.commit()
    mqtt_publish.single(
        topic=f"colonnine/{sess.colonnina_id}/cmd",
        payload=json.dumps({"action": "off", "presa": sess.presa_n}),
        hostname=settings.mqtt_host, port=settings.mqtt_port,
        auth={"username": settings.mqtt_user, "password": settings.mqtt_pass},
    )
    return sess
