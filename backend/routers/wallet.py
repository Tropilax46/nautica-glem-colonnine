"""Wallet utente: ricariche Stripe + storico movimenti."""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import stripe
from database import get_db
from models import User, Ledger, LedgerType
from settings import settings
from .deps import current_user

router = APIRouter()
stripe.api_key = settings.stripe_secret


class TopupIn(BaseModel):
    amount_eur: float = Field(gt=1, le=500)


class TopupOut(BaseModel):
    checkout_url: str
    session_id: str


@router.post("/topup", response_model=TopupOut)
def topup(body: TopupIn, user: User = Depends(current_user)):
    """Crea una Stripe Checkout Session. L'app apre la URL nel browser di sistema;
    al successo Stripe rimanda allo schema deep-link `nauticaglem://wallet`."""
    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "eur",
                "product_data": {"name": f"Ricarica wallet €{body.amount_eur:.2f}"},
                "unit_amount": int(body.amount_eur * 100),
            },
            "quantity": 1,
        }],
        customer_email=user.email,
        metadata={"user_id": str(user.id), "type": "wallet_topup"},
        success_url="nauticaglem://wallet?topup=ok",
        cancel_url="nauticaglem://wallet?topup=cancel",
    )
    return TopupOut(checkout_url=session.url, session_id=session.id)


@router.get("")
def my_wallet(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = (db.query(Ledger)
              .filter_by(user_id=user.id)
              .order_by(Ledger.created_at.desc())
              .limit(50).all())
    return {"saldo_eur": float(user.wallet_eur or 0),
            "movimenti": [{"ts": r.created_at.isoformat(),
                           "type": r.type, "delta_eur": float(r.delta_eur or 0),
                           "kwh": float(r.kwh or 0),
                           "note": r.note} for r in rows]}


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig,
                                               settings.stripe_webhook_secret)
    except Exception:
        raise HTTPException(400, "firma webhook non valida")

    if event["type"] == "checkout.session.completed":
        s = event["data"]["object"]
        if s.get("metadata", {}).get("type") == "wallet_topup" and s.get("payment_status") == "paid":
            uid = s["metadata"]["user_id"]
            amount = Decimal(s["amount_total"]) / 100
            user = db.get(User, uid)
            if user:
                user.wallet_eur = (user.wallet_eur or 0) + amount
                db.add(Ledger(user_id=user.id, type=LedgerType.TOPUP,
                              delta_eur=amount, stripe_intent=s["id"]))
                db.commit()
    return {"ok": True}
