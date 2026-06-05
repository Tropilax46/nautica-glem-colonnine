# Daily Optimization Prompt — Nautica GLEM Colonnine
*Generato il: 2026-05-31 | Ciclo: 1*

---

```xml
<role>
Sei un ingegnere software senior specializzato in sistemi IoT industriali e API backend
per infrastrutture critiche. Lavori sul progetto "Nautica GLEM Colonnine": un sistema di
colonnine elettriche smart per marina, composto da backend FastAPI + PostgreSQL, un MQTT
worker per telemetria real-time, un firmware ESP32 e una mobile app React Native.
Il codice gira in un contesto reale dove errori di billing o race condition causano perdite
economiche dirette o disconnessioni impreviste dei clienti.
</role>

<context>
Stack tecnico:
- Backend: Python 3.12 · FastAPI · SQLAlchemy 2.x · pydantic-settings
- Worker: paho-mqtt · billing differenziale kWh
- Database: PostgreSQL 16 con schema definito in database/schema.sql
- Firmware: ESP32 Arduino · PZEM-004T · MQTT TLS
- Frontend: Next.js admin dashboard · React Native mobile app

Struttura cartelle principali:
  backend/main.py · models.py · database.py · mqtt_worker.py · settings.py
  backend/routers/ → auth.py · colonnine.py · sessions.py · wallet.py · admin.py · deps.py
  firmware/colonnina_smart.ino
  database/schema.sql
</context>

<task>
Applica le seguenti ottimizzazioni al codice, rispettando l'ordine di priorità.
Per ogni fix: (1) ragiona sul perché il problema causa danno reale, (2) applica la
modifica minimale e corretta, (3) non introdurre dipendenze nuove non presenti in
requirements.txt salvo diversa indicazione.

Ragiona step-by-step prima di scrivere codice. Non inventare API che non conosci.
</task>

<optimizations>

  <!-- ═══════ CRITICI ═══════ -->

  <fix id="C1" priority="critical" file="backend/routers/sessions.py">
    <problem>
      Route conflict: `GET /sessions/active` è registrato DOPO `GET /sessions/{session_id}`.
      FastAPI valuta le route nell'ordine di registrazione, quindi la stringa "active"
      viene catturata come session_id e il lookup per UUID fallisce con 422 o 404.
    </problem>
    <action>
      Sposta il metodo `active()` PRIMA del metodo `stop()` nel file, oppure cambia
      il path in `GET /sessions/my-active`. Scegli la soluzione che non rompe il contratto
      API esistente (se c'è già un client mobile che usa `/sessions/active`, sposta solo
      l'ordine di registrazione).
    </action>
    <expected_outcome>
      `GET /sessions/active` risponde correttamente con la lista delle sessioni attive
      dell'utente senza essere intercettata dal pattern `{session_id}`.
    </expected_outcome>
  </fix>

  <fix id="C2" priority="critical" file="backend/mqtt_worker.py">
    <problem>
      In `handle_telemetry`, dopo aver trovato la sessione attiva, il codice fa:
        `col = db.get(Colonnina, colonnina_id)`
        `tariff = Decimal(str(col.tariff_eur or ...))`
      Se `col` è None (colonnina rimossa dal DB ma ancora attiva su MQTT), il codice
      crasha con AttributeError e lascia la sessione in stato inconsistente.
    </problem>
    <action>
      Aggiungere un guard dopo `db.get(Colonnina, colonnina_id)`:
        if not col: db.commit(); return
      Questo va inserito subito prima del blocco billing differenziale.
    </action>
  </fix>

  <fix id="C3" priority="critical" file="backend/routers/wallet.py">
    <problem>
      Il webhook Stripe `/webhooks/stripe` non è idempotente: se Stripe rimanda lo
      stesso evento (retry automatico dopo timeout), il wallet viene ricaricato due volte.
      Il campo `stripe_intent` esiste già in `Ledger` — va usato come chiave di unicità.
    </problem>
    <action>
      Prima di aggiornare `user.wallet_eur`, verificare se esiste già un record Ledger
      con `stripe_intent == s["id"]`. Se esiste, restituire `{"ok": True}` senza modifiche.
      Esempio:
        existing = db.query(Ledger).filter_by(stripe_intent=s["id"]).first()
        if existing:
            return {"ok": True}
    </action>
  </fix>

  <fix id="C4" priority="critical" file="backend/main.py">
    <problem>
      `db.execute("SELECT 1")` usa una stringa raw — deprecato e rimosso in SQLAlchemy 2.x.
      Causa `RemovedIn20Warning` o direttamente un errore a runtime con driver psycopg3.
    </problem>
    <action>
      Aggiungere `from sqlalchemy import text` agli import e cambiare la chiamata in:
        db.execute(text("SELECT 1"))
    </action>
  </fix>

  <!-- ═══════ IMPORTANTI ═══════ -->

  <fix id="I1" priority="important" file="backend/routers/admin.py">
    <problem>
      `list_colonnine` esegue un `db.scalar(select(ChargeSession)...)` DENTRO un loop
      su tutte le colonnine → N+1 query. Con 50 colonnine = 101 query per singola
      richiesta HTTP. Peggio ancora, `transactions` fa `db.get(ChargeSession, ...)` per
      ogni riga del ledger.
    </problem>
    <action>
      Per `list_colonnine`: caricare in anticipo le sessioni attive con una sola query
      raggruppata per (colonnina_id, presa_n), poi usare un dict per il lookup O(1).

      Per `transactions`: aggiungere un JOIN su `sessions` nella query principale
      invece di fare `db.get` nel loop.
    </action>
  </fix>

  <fix id="I2" priority="important" file="backend/models.py">
    <problem>
      `datetime.utcnow` è deprecato da Python 3.12 e produrrà DeprecationWarning
      (e sarà rimosso in 3.14). I timestamp vengono salvati senza timezone info,
      creando ambiguità con il campo TIMESTAMPTZ del database PostgreSQL.
    </problem>
    <action>
      Aggiungere `from datetime import timezone` e sostituire tutte le occorrenze di
      `default=datetime.utcnow` con `default=lambda: datetime.now(timezone.utc)`.
      Fare lo stesso in mqtt_worker.py dove compare `datetime.utcnow()`.
    </action>
  </fix>

  <!-- ═══════ MINORI ═══════ -->

  <fix id="M1" priority="minor" file="firmware/colonnina_smart.ino">
    <problem>
      Variabile `colonnninaId` ha un typo (tripla 'n'). Se il valore viene usato come
      topic MQTT, il topic risultante sarà sbagliato e il backend non riceverà i messaggi.
    </problem>
    <action>
      Rinominare `colonnninaId` → `colonninaId` in tutte le occorrenze del file.
    </action>
  </fix>

</optimizations>

<output_format>
Per ogni fix applicato, aggiungi una riga al file `docs/daily-optimization-log.md`:
  | {data} | {fix_id} | {file} | {descrizione breve della modifica} | ✅ |
Se un fix non è applicabile (es. codice già corretto), segna: ⏭️ già risolto.
</output_format>

<constraints>
- NON cambiare signature delle funzioni esposte come endpoint REST
- NON introdurre nuove librerie esterne non presenti in requirements.txt
- Le modifiche devono essere minimali e chirurgiche — no refactoring globale
- Mantenere i commenti italiani già presenti nel codice
</constraints>
```
