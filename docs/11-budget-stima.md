# 11 — Stima di budget

> Valori indicativi, IVA esclusa, per **50 colonnine** (ipotesi mediana del range 30-80).

## CAPEX — Investimento iniziale

| Voce | Q.tà | Costo unit. | Totale |
|---|---:|---:|---:|
| Kit retrofit colonnina (BOM `02`) | 50 | 200 € | 10.000 € |
| Installazione elettricista (1 h × 50, con sopralluogo) | 50 | 70 € | 3.500 € |
| Infrastruttura rete molo (router LTE + AP + switch) | 1 | 1.150 € | 1.150 € |
| Server VPS — setup iniziale | 1 | 200 € | 200 € |
| Targhe colonnina + grafica + QR plastificati | 100 | 3 € | 300 € |
| Sviluppo software (firmware + backend + app + admin) | — | — | vedi sotto |
| **Subtotale hardware + installazione** | | | **15.150 €** |

### Sviluppo software

Tre scenari:

| Scenario | Descrizione | Stima |
|---|---|---:|
| **A) Solo in casa** | tu o un dev interno | 0 € (solo tempo) |
| **B) Freelance Italia** | 1 dev senior ~ 350 €/g × 60 g (Fase 1+2) | ~21.000 € |
| **C) Agenzia/software house** | turnkey con SLA | 35.000-55.000 € |

Raccomandazione: **B**, eventualmente con tuo coinvolgimento per ridurre i giorni.

### Una tantum extra
- Account Apple Developer 99 €/anno + Google Play 25 € una tantum.
- Stripe attivazione: gratis.
- Dominio + certificati: 15 €/anno.

## OPEX — Costi ricorrenti (mese)

| Voce | Costo |
|---|---:|
| VPS Hetzner CX31 | 13 € |
| Backup Hetzner Storage Box | 4 € |
| SIM dati M2M (5 GB) | 5 € |
| Stripe commissioni (1,4% + 0,25 € per ricarica) | variabile |
| Manutenzione hardware (forfait) | 50 € |
| **Totale OPEX mensile fisso** | **~72 €/mese** |

In aggiunta: commissioni Stripe sulle ricariche (~3% medio).

## Ricavi attesi (modello semplice)

Assunzioni:
- 50 colonnine × 2 prese = 100 prese.
- Tasso di utilizzo medio annuo: **15%** delle prese in uso 8 h/giorno = ~12 ore/mese per presa.
- Potenza media erogata: **1,5 kW**.
- kWh medi per presa/mese = 12 × 1,5 = **18 kWh**.
- 100 prese × 18 kWh = **1.800 kWh/mese**.
- Margine: tariffa 0,55 €/kWh, costo energia all'ingrosso 0,30 €/kWh → **margine 0,25 €/kWh**.

Margine lordo mensile: 1.800 × 0,25 = **450 €/mese** → ~5.400 €/anno.

⚠️ Questo è il **caso basso fuori stagione**. In stagione (luglio-agosto):
- Tasso utilizzo 60% × 12 h/giorno × 30 giorni → 216 h/presa/mese, 1,5 kW → 324 kWh/presa/mese × 100 prese = **32.400 kWh** → margine **8.100 €/mese**.

**Ricavo annuo stimato (mix alta/bassa stagione):** 25.000-40.000 € margine lordo.

**Payback hardware + installazione:** ~12-18 mesi.

**Payback completo (incl. sviluppo software scenario B):** ~24-30 mesi.

## Sensibilità e rischi

| Variabile | Effetto |
|---|---|
| Tariffa €/kWh +0,05 | +1.080 € margine annuo |
| Utenza turistica raddoppia | +50% ricavi alta stagione |
| Aumento costo energia all'ingrosso | margine eroso, può servire aggiornare tariffa |
| Pagamento solo a forfait/canone (non a consumo) | il sistema funziona uguale ma diventa "controllo accessi"; ricavo prevedibile, no upside |

## Finanziamenti / agevolazioni potenziali
- **PNRR Marina 4.0 / Transizione 5.0** — verificare bandi attivi nella tua regione (potrebbero coprire il 40-60% dell'investimento smart).
- **Credito d'imposta beni 4.0** — applicabile se hardware è certificato 4.0 (richiede perizia).
- **Bandi camera di commercio per digitalizzazione PMI** — spesso 50% a fondo perduto fino a 10 k€.

Consigliato confrontarsi con un commercialista che segue agevolazioni 4.0 per ottimizzare la fiscalità prima dell'acquisto.
