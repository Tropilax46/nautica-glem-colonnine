"""
Worker MQTT — consuma i messaggi delle colonnine e aggiorna il DB.

Avvio: python mqtt_worker.py
In produzione: gestire con systemd o supervisord.
"""
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal

import paho.mqtt.client as mqtt
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Colonnina, ChargeSession, Telemetry, Ledger, LedgerType, SessionStatus, User
from settings import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("mqtt_worker")


def handle_status(db: Session, colonnina_id: str, payload: dict):
    col = db.get(Colonnina, colonnina_id)
    if not col:
        return
    col.online = payload.get("online", True)
    # [O6] aggiorna firmware solo se presente nel payload: uno status di heartbeat
    # senza il campo non deve azzerare la versione firmware gia registrata
    fw = payload.get("firmware")
    if fw is not None:
        col.firmware = fw
    # [I2] Fix: timezone-aware
    col.last_seen = datetime.now(timezone.utc)
    db.commit()


def handle_telemetry(db: Session, colonnina_id: str, payload: dict):
    """Telemetria + billing in-line."""
    presa_n = int(payload.get("presa", 0))
    if presa_n not in (1, 2):
        return

    sess = (
        db.query(ChargeSession)
        .filter(
            ChargeSession.colonnina_id == colonnina_id,
            ChargeSession.presa_n == presa_n,
            ChargeSession.status == SessionStatus.ACTIVE,
        )
        .first()
    )

    # [I2] Fix: timezone-aware
    db.add(Telemetry(
        session_id=sess.id if sess else None,
        colonnina_id=colonnina_id,
        presa_n=presa_n,
        ts=datetime.now(timezone.utc),
        voltage=payload.get("V"),
        current=payload.get("A"),
        power=payload.get("W"),
        kwh=payload.get("kWh"),
        pf=payload.get("pf"),
    ))

    if not sess:
        db.commit()
        return

    # Billing differenziale
    new_kwh = Decimal(str(payload.get("kWh", 0)))
    last = sess.last_kwh_meter or new_kwh
    delta_kwh = max(Decimal("0"), new_kwh - last)
    col = db.get(Colonnina, colonnina_id)

    # [C2] Fix: guard su col None — colonnina rimossa dal DB ma ancora attiva su MQTT
    if not col:
        log.warning("Colonnina %s non trovata in DB, billing saltato", colonnina_id)
        db.commit()
        return

    tariff = Decimal(str(col.tariff_eur or settings.base_tariff_eur_per_kwh))
    cost = delta_kwh * tariff

    sess.last_kwh_meter = new_kwh
    sess.kwh = (sess.kwh or 0) + delta_kwh
    sess.cost_eur = (sess.cost_eur or 0) + cost

    user = db.get(User, sess.user_id)
    # [O2] guard su user None: utente rimosso dal DB ma sessione ancora attiva
    if not user:
        log.warning("Utente %s non trovato in DB, billing saltato", sess.user_id)
        db.commit()
        return
    user.wallet_eur = (user.wallet_eur or 0) - cost
    db.add(Ledger(
        user_id=user.id, session_id=sess.id,
        type=LedgerType.ENERGY, delta_eur=-cost, kwh=delta_kwh,
    ))

    # Auto-stop se wallet sotto soglia
    if user.wallet_eur < Decimal(str(settings.min_wallet_to_continue_eur)):
        log.info("Wallet basso → stop %s", sess.id)
        publish_cmd(colonnina_id, {"action": "off", "presa": presa_n})
        sess.status = SessionStatus.STOPPING

    db.commit()


def handle_ack(db: Session, colonnina_id: str, payload: dict):
    sid = payload.get("session")
    if not sid:
        return
    # [O1] db.get: lookup per chiave primaria (identity map) invece di query+filter
    sess = db.get(ChargeSession, sid)
    if sess and payload.get("result") == "ok":
        sess.status = SessionStatus.ACTIVE
        db.commit()


# ---- Pub/Sub client globale -----------------------------------------------
client = mqtt.Client(client_id="glem-backend")


def publish_cmd(colonnina_id: str, payload: dict):
    client.publish(f"colonnine/{colonnina_id}/cmd", json.dumps(payload), qos=1)


def on_message(_c, _u, msg):
    try:
        parts = msg.topic.split("/")
        if len(parts) < 3:
            return
        _, colonnina_id, suffix = parts
        payload = json.loads(msg.payload.decode())
        db = SessionLocal()
        try:
            if suffix == "status":      handle_status(db, colonnina_id, payload)
            elif suffix == "telemetry": handle_telemetry(db, colonnina_id, payload)
            elif suffix == "ack":       handle_ack(db, colonnina_id, payload)
        finally:
            db.close()
    except Exception as e:
        log.exception("Errore msg %s: %s", msg.topic, e)


def main():
    client.username_pw_set(settings.mqtt_user, settings.mqtt_pass)
    if settings.mqtt_port == 8883:
        client.tls_set(ca_certs=settings.mqtt_ca_cert)
    client.on_message = on_message
    client.connect(settings.mqtt_host, settings.mqtt_port)
    client.subscribe("colonnine/+/status", qos=1)
    client.subscribe("colonnine/+/telemetry", qos=0)
    client.subscribe("colonnine/+/ack", qos=1)
    log.info("MQTT worker avviato")
    client.loop_forever()


if __name__ == "__main__":
    main()
