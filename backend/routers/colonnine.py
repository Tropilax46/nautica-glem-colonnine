"""Endpoint pubblici per le colonnine.

Espone uno shape pulito per il front-end (app mobile):
    {
      id, nome, posto_barca, tariffa_eur_kwh, online,
      prese: [{numero, stato: "libera" | "occupata" | "fuori_servizio"}]
    }
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Colonnina, Presa
from .deps import current_user

router = APIRouter()


class PresaPublic(BaseModel):
    numero: int
    stato: str


class ColonninaPublic(BaseModel):
    id: str
    nome: str
    posto_barca: str
    tariffa_eur_kwh: float
    online: bool
    prese: list[PresaPublic]


def _stato_presa(p: Presa) -> str:
    if p.status == "guasto":
        return "fuori_servizio"
    return "occupata" if p.in_use else "libera"


def _to_public(c: Colonnina) -> ColonninaPublic:
    pontile = c.pontile or ""
    posto = c.posto or ""
    return ColonninaPublic(
        id=c.id,
        nome=c.label or c.id,
        posto_barca=(pontile + " " + posto).strip(),
        tariffa_eur_kwh=float(c.tariff_eur or 0),
        online=bool(c.online),
        prese=[
            PresaPublic(numero=p.numero, stato=_stato_presa(p))
            for p in sorted(c.prese, key=lambda x: x.numero)
        ],
    )


@router.get("", response_model=list[ColonninaPublic])
def list_all(db: Session = Depends(get_db), _=Depends(current_user)):
    rows = db.query(Colonnina).order_by(Colonnina.id).all()
    return [_to_public(c) for c in rows]


@router.get("/{cid}", response_model=ColonninaPublic)
def detail(cid: str, db: Session = Depends(get_db), _=Depends(current_user)):
    c = db.get(Colonnina, cid)
    if not c:
        raise HTTPException(404, "colonnina non trovata")
    return _to_public(c)


@router.get("/by-qr/{qr}", response_model=ColonninaPublic)
def by_qr(qr: str, db: Session = Depends(get_db), _=Depends(current_user)):
    p = db.query(Presa).filter_by(qr_code=qr).first()
    if not p:
        raise HTTPException(404, "QR sconosciuto")
    return _to_public(p.colonnina)
