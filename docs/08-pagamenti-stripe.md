# 08 — Pagamenti con Stripe (wallet ricaricabile)

## Modello scelto: wallet prepagato
L'utente **ricarica** il proprio wallet con tagli fissi o importo libero. Le sessioni di prelievo scalano dal wallet senza creare nuova transazione Stripe.

Vantaggi:
- Una sola transazione Stripe per ricarica → meno commissioni rispetto a pagamento per sessione.
- L'utente vede la spesa prima di iniziare.
- Funziona anche con connettività ballerina al molo: il backend ha già il saldo, non serve interrogare Stripe in tempo reale.

## Tagli proposti
| Importo | Bonus |
|---|---|
| 10 € | — |
| 20 € | — |
| 50 € | +2 € |
| 100 € | +5 € |
| importo libero | — |

## Flusso tecnico

```
App (Stripe PaymentSheet) ──▶  Backend POST /wallet/topup  ─┐
                                       │                     │
                                       ▼                     │
                              crea PaymentIntent             │
                                       │                     │
   ◀── client_secret ─────────────────┘                     │
                                                             │
App apre PaymentSheet con Apple Pay / Google Pay / carta     │
                                                             │
Stripe → webhook ─────────────────────────────────────────────┘
                          POST /webhooks/stripe (firmato)
                                       │
                                       ▼
                        inserisce in `ledger` riga TOPUP
                        aggiorna users.wallet_eur
                        notifica push "Ricarica completata"
```

## Codice backend (estratto)

```python
@router.post("/topup")
def create_topup(amount_eur: float, user: User = Depends(current_user)):
    intent = stripe.PaymentIntent.create(
        amount=int(amount_eur * 100),
        currency="eur",
        metadata={"user_id": str(user.id), "type": "wallet_topup"},
        automatic_payment_methods={"enabled": True},
    )
    return {"client_secret": intent.client_secret, "intent_id": intent.id}
```

```python
@router.post("/webhooks/stripe")
async def stripe_webhook(req: Request, db: Session = Depends(get_db)):
    payload = await req.body()
    sig = req.headers.get("stripe-signature", "")
    event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        if pi["metadata"].get("type") == "wallet_topup":
            credit_wallet(db, user_id=pi["metadata"]["user_id"],
                          amount_eur=pi["amount"] / 100, intent=pi["id"])
    return {"ok": True}
```

## Compliance
- **PCI-DSS** gestito da Stripe (noi non vediamo mai i dati carta).
- **Privacy/GDPR**: dati transazioni conservati 10 anni (norma fiscale IT).
- **Fatturazione**: per gli scontrini emettere ricevuta tramite servizio Fatture in Cloud / Aruba; Stripe genera il documento di vendita ma non la fattura italiana valida ai fini IVA.

## Commissioni Stripe
- Italia: **1,4% + 0,25 €** per carte UE / 2,9% extra-UE.
- Su una ricarica da 20 €: 0,53 € → margine va aumentato leggermente nella tariffa €/kWh o nei tagli (vedi bonus sui tagli da 50 €+).

## Alternative valutate

| Provider | Pro | Contro | Scelta |
|---|---|---|---|
| Stripe | SDK eccellente, Apple/Google Pay, recurring | Commissione | ✅ |
| PayPal | Brand noto | UX peggiore, commissioni alte | ❌ |
| Satispay | Italiano, costi bassi per piccoli importi | Meno utenti turisti stranieri | Aggiungibile in fase 2 |
| Bonifico | 0 commissioni | UX terribile, fuori per MVP | ❌ |
