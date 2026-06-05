# Report Auto-Ottimizzazione — 31/05/2026

Esecuzione automatica del task `ottimizza-commit-push`. Questa è la **2ª esecuzione odierna**; conferma e aggiorna la precedente.

## Esito: commit/push NON eseguiti (bloccato — invariato)

Le operazioni git (`add`/`commit`/`push`) restano **impossibili** in questa sessione non presidiata, per due cause indipendenti, entrambe fuori dal mio controllo:

1. **`.git/config` non leggibile dall'ambiente.** Ogni comando git fallisce con `fatal: unknown error occurred while reading the configuration files`. Il file è elencato da `ls` (54 byte) ed è leggibile lato host, ma da bash ogni `cat`/append/scrittura su `.git/config` ritorna *"No such file or directory"* (mentre altri file in `.git/` come `HEAD` si leggono normalmente). È un blocco specifico di quel file, lato host. Gli override `GIT_CONFIG_GLOBAL`/`GIT_CONFIG_SYSTEM` non aiutano: git deve leggere il config locale del repo. Finché non si sblocca, **nessun** comando git funziona.
2. **Nessuna credenziale GitHub.** Confermato: `~/.ssh` assente, nessun `~/.git-credentials`, nessun token. Il remote è HTTPS (`github.com/Tropilax46/nautica-glem-colonnine.git`). Anche risolto il punto 1, il `push` fallirebbe per mancata autenticazione.

**Decisione (come la run precedente):** nessuna modifica scritta ai sorgenti. In una sessione non presidiata, applicare cambiamenti senza poterli committare né validare lascerebbe il working tree sporco e in stato incerto. Le ottimizzazioni qui sotto sono confermate, a basso rischio e pronte all'applicazione manuale.

## Ottimizzazioni individuate (verificate in questa run)

### Bug — priorità alta
**`GET /wallet` va in crash a runtime.** `backend/routers/wallet.py` usa `Ledger.created_at` (ordinamento, riga ~52) e `r.note` (riga ~58), ma il modello `Ledger` in `backend/models.py` **non ha** quelle colonne: ha solo `id, user_id, session_id, type, delta_eur, kwh, stripe_intent`. Ogni richiesta → `AttributeError`.

Fix — aggiungere al modello `Ledger`:
```python
note          = Column(Text)
created_at    = Column(DateTime, default=_now, index=True)
```
Modifica di schema → accompagnare con migrazione Alembic (`create_all` non altera tabelle esistenti in produzione).

### Pulizia / coerenza — priorità media
- **`datetime.utcnow()` deprecato** in `backend/routers/auth.py` (riga 36, `_make_token`). Il resto del codebase usa già `datetime.now(timezone.utc)`. Allineare: `datetime.now(timezone.utc) + timedelta(minutes=minutes)`.
- **File spurio `git` (0 byte)** nella root: residuo di un comando andato storto (es. `> git`). Da rimuovere; eventualmente aggiungere a `.gitignore`.
- **Lock Office presenti:** `.~lock.BOM_e_Budget_NauticaGLEM.xlsx#` e `~$BOM_e_Budget_NauticaGLEM.xlsx` → workbook aperto in Excel/LibreOffice. `~$*` è già in `.gitignore`; aggiungere anche `.~lock.*#`. Probabilmente correlati al blocco di `.git`.
- **`__pycache__/`** in `backend/`, `backend/routers/`, `scripts/`: già coperti da `.gitignore`; verificare che non siano tracciati con `git ls-files | grep pyc` una volta ripristinato git.

## Come sbloccare
1. Chiudere l'app host che tiene bloccato `.git`/i file del progetto (Excel/LibreOffice/editor o GUI git — vedi i file di lock sopra).
2. Eseguire manualmente `git add . && git commit && git push`.
3. Per rendere il push automatico in futuro: configurare credenziali accessibili (token HTTPS in un credential helper, o chiave SSH in `~/.ssh`).
