"""Profilo utente."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from .deps import current_user
from models import User

router = APIRouter()


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str | None
    phone: str | None
    boat_name: str | None
    wallet_eur: float

    class Config: from_attributes = True


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return UserOut(
        id=str(user.id), email=user.email, full_name=user.full_name,
        phone=user.phone, boat_name=user.boat_name,
        wallet_eur=float(user.wallet_eur or 0),
    )
