"""
Nautica GLEM — backend gestionale colonnine
Bootstrap FastAPI con i router principali.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models, schemas
from routers import auth, users, colonnine, sessions, wallet, admin
from settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # In produzione le tabelle si creano con Alembic; in dev possiamo farlo qui.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Nautica GLEM — Colonnine API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/auth",        tags=["auth"])
app.include_router(users.router,      prefix="/users",       tags=["users"])
app.include_router(colonnine.router,  prefix="/colonnine",   tags=["colonnine"])
app.include_router(sessions.router,   prefix="/sessions",    tags=["sessions"])
app.include_router(wallet.router,     prefix="/wallet",      tags=["wallet"])
app.include_router(admin.router,      prefix="/admin",       tags=["admin"])


@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute("SELECT 1")
    return {"status": "ok", "service": "glem-colonnine"}
