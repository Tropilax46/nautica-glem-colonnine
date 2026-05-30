"""Dependency comuni: utente loggato, ruolo admin."""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserRole
from settings import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def current_user(token: str = Depends(oauth2_scheme),
                 db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(401, "non autenticato")
    try:
        payload = jwt.decode(token, settings.jwt_secret,
                             algorithms=[settings.jwt_algorithm])
        u = db.get(User, payload["sub"])
        if not u: raise JWTError()
        return u
    except JWTError:
        raise HTTPException(401, "token non valido")


def require_admin(user: User = Depends(current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(403, "richiesto ruolo admin")
    return user
