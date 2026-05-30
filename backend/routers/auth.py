"""Autenticazione: registrazione, login, refresh."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
from database import get_db
from models import User
from settings import settings

router = APIRouter()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    phone: str | None = None
    boat_name: str | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


def _make_token(sub: str, minutes: int) -> str:
    payload = {"sub": sub, "exp": datetime.utcnow() + timedelta(minutes=minutes)}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@router.post("/register", response_model=TokenOut)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=body.email).first():
        raise HTTPException(409, "email già registrata")
    u = User(
        email=body.email,
        password_hash=pwd_ctx.hash(body.password),
        full_name=body.full_name,
        phone=body.phone,
        boat_name=body.boat_name,
    )
    db.add(u); db.commit(); db.refresh(u)
    return TokenOut(
        access_token=_make_token(str(u.id), settings.jwt_access_min),
        refresh_token=_make_token(str(u.id), settings.jwt_refresh_days * 24 * 60),
    )


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter_by(email=body.email).first()
    if not u or not pwd_ctx.verify(body.password, u.password_hash):
        raise HTTPException(401, "credenziali non valide")
    return TokenOut(
        access_token=_make_token(str(u.id), settings.jwt_access_min),
        refresh_token=_make_token(str(u.id), settings.jwt_refresh_days * 24 * 60),
    )


class RefreshIn(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenOut)
def refresh(body: RefreshIn):
    try:
        data = jwt.decode(body.refresh_token, settings.jwt_secret,
                          algorithms=[settings.jwt_algorithm])
        sub = data["sub"]
    except JWTError:
        raise HTTPException(401, "refresh token non valido")
    return TokenOut(
        access_token=_make_token(sub, settings.jwt_access_min),
        refresh_token=_make_token(sub, settings.jwt_refresh_days * 24 * 60),
    )
