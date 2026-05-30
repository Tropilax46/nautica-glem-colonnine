# 12 — Sicurezza e normative

## Normative tecniche di riferimento

| Norma | Cosa copre |
|---|---|
| **CEI 64-8 V3** | Impianti elettrici a bassa tensione — sezione 7-709 (porti turistici e marina) |
| **CEI EN 60364-7-709** | Stessa cosa in formato CENELEC |
| **CEI EN 60309** | Connettori industriali / prese da pontile (le "blu" 16A 230V) |
| **CEI 31-30 / EN 60079** | Atmosfere potenzialmente esplosive (rilevante se vicino a distributori carburante in marina) |
| **D.Lgs. 81/08** | Sicurezza sul lavoro durante l'installazione |
| **Legge 46/90 → DM 37/08** | Dichiarazione di conformità impianto elettrico — **obbligatoria** |

### Punti critici dalla CEI 64-8/709 (sintesi)

- Differenziale **30 mA tipo A** per ogni presa (o massimo gruppo di prese), già richiesto.
- Magnetotermico **per ogni presa** (no più prese sotto stesso magnetotermico).
- Grado IP65 minimo per le colonnine.
- Cavi a posa fissa: H07RN-F o equivalenti per ambiente marino.
- Conduttore di terra continuo, verifica annuale (resistenza < 1 Ω).
- Distanza minima delle prese dall'acqua: 80 cm (consigliato 1 m).
- Le prese vanno marcate con tensione, frequenza, corrente nominale.

> ✅ Tutto questo dovrebbe essere già a posto perché le colonnine sono installate.
> 🔧 La parte "smart" che aggiungiamo è **a valle** del differenziale e magnetotermico esistenti, quindi non altera la conformità dell'impianto se eseguita a regola d'arte.

## Dichiarazione di conformità (DiCo)
Dopo l'aggiunta del modulo smart, l'elettricista deve emettere una **nuova DiCo** ai sensi del DM 37/08 per la modifica all'impianto esistente. Conservare con allegati:
- Schema elettrico aggiornato.
- Foto cassettina retrofit.
- Certificati dei materiali (PZEM, contattori, alimentatore).
- Verifica continuità terra + corrente di intervento differenziale.

## Privacy e GDPR

Dati personali trattati:
- Email, telefono, nome, nome barca → finalità contrattuale.
- Carta di credito → trattata da Stripe (responsabile esterno), noi conserviamo solo `payment_intent_id`.
- Posizione → **non raccogliamo**: lo scan QR identifica la presa, non serve geolocalizzare l'utente.

Documenti da preparare:
- **Informativa privacy** in app + sul sito.
- **Termini e condizioni d'uso** (tariffe, rimborsi, limitazione responsabilità).
- **Registro dei trattamenti** (interno).
- Nominare Stripe e il provider cloud (Hetzner/Aruba) come **responsabili del trattamento** (DPA — Stripe e Hetzner hanno DPA standard scaricabili).

Conservazione:
- Dati utente: fino a cancellazione account + 10 anni per fini fiscali sulle transazioni.
- Telemetria: 90 giorni in dettaglio, poi aggregata.

## Misure di sicurezza informatica

| Misura | Implementazione |
|---|---|
| Cifratura in transito | TLS 1.2+ ovunque (HTTPS, MQTT/TLS) |
| Cifratura a riposo | volume crittografato sul VPS + password hash bcrypt |
| Backup | Hetzner Storage Box giornaliero, retention 30 giorni |
| Aggiornamenti | sistema operativo: automatic security updates; firmware ESP32: OTA firmato |
| Accesso admin | login + 2FA TOTP obbligatorio per ruolo admin |
| Audit | tabella `audit_log` traccia tutte le azioni admin |
| Segregazione | rete colonnine isolata via VLAN, non accessibile da internet pubblica |

## Sicurezza fisica colonnina
- Cassone con chiave (già presente).
- Pulsante d'emergenza meccanico **fuori** dal cassone, raggiungibile da chiunque.
- Modulo retrofit dentro al cassone, fissato con viti di sicurezza.

## Cosa fare in caso di incidente
1. Pulsante d'emergenza esterno taglia la corrente alla colonnina.
2. Dal pannello admin: "force-off" tutte le prese del pontile coinvolto.
3. Notifica push a tutti gli utenti con sessione attiva su quel pontile.
4. Log su `audit_log` automatico.
5. Apertura ticket di manutenzione + sostituzione/verifica componenti.

## Assicurazione
Verificare con il broker che la polizza di responsabilità civile del molo copra:
- Danni a barche per malfunzionamento colonnina.
- Cyber-risk (intrusione informatica con perdita dati clienti / blocco operatività).

Costo indicativo polizza cyber per attività piccola: 500-1.200 €/anno.
