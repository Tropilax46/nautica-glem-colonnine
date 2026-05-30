# 02 — Hardware: schema e Bill Of Materials (v2.3)

> **Aggiornamenti v2.3 (correzioni gap di revisione ingegneria, 14/05/2026):**
> - **HLK-PM12 (3 W) → HLK-10M12 (10 W)**: il PM12 era sottodimensionato (vedi calcolo sotto).
> - **Pressacavi IP68** aggiunti al BOM: senza, la cassetta IP66 perde la classificazione (IP grade reale crolla a IP20).
> - **Pull-up 4,7 kΩ** per il DS18B20 esplicitato (kit resistori assortiti che copre anche i 220 Ω di gate del MOSFET).
>
> **Aggiornamenti v2.2 (gestione termica):**
> - Sfiato a membrana M12 IP69 (RS) per ventilazione passiva.
> - DS18B20 waterproof per monitor + auto-protezione firmware.
> - Cassetta passata a 294×152×75 mm (dissipazione passiva).
>
> **Aggiornamenti v2 (feedback del 14/05/2026):**
> - Cassetta colonnina **in metallo** → antenna WiFi esterna (gabbia di Faraday).
> - Rete molo **100% wireless** (TP-Link Deco X50-Outdoor mesh), niente switch PoE.
> - Rimossi dal BOM differenziale, magnetotermico, manodopera (gia' presenti/gestiti a parte).
> - Contattore con **bobina 12 V DC** + driver MOSFET al posto di modulo rele' 5 V + contattore 230 V AC.

## Schema concettuale per singola colonnina (2 prese elettriche)

```
230V FN ──┬── [diff. 30mA esistente] ──┬── [magneto C16 esistente] ──┬── contattore K1 (12V DC) ── PRESA 1
          │                            │                              │
          │                            │                              └── PZEM-004T #1 (V,A,W,kWh)
          │                            │
          │                            └── [magneto C16 esistente] ──┬── contattore K2 (12V DC) ── PRESA 2
          │                                                           │
          │                                                           └── PZEM-004T #2
          │
          └── HLK-10M12 (230V→12V, 10W) ─┬── bobina K1 (via MOSFET driver pilotato da GPIO ESP32)
                                   ├── bobina K2 (idem)
                                   └── buck 12V→5V ── ESP32-WROOM-32U
                                                       ├─ UART2 ← PZEM #1
                                                       ├─ UART SW ← PZEM #2
                                                       ├─ GPIO → MOSFET K1
                                                       ├─ GPIO → MOSFET K2
                                                       ├─ GPIO → LED RGB WS2812
                                                       ├─ GPIO ← pulsante emergenza
                                                       └─ WiFi 2.4 GHz via antenna ESTERNA su SMA
```

L'antenna WiFi è esterna alla cassetta metallica: cavo pigtail IPEX→SMA da dentro la colonnina, presa SMA femmina passante IP67 sul lato/sopra della cassetta, antenna omnidirezionale stilo 5 dBi avvitata fuori.

## BOM per singola colonnina

| # | Componente | Modello consigliato | Q.tà | Prezzo unit. | Totale |
|---|---|---|---:|---:|---:|
| 1 | Micro-controller WiFi (versione antenna esterna) | ESP32-WROOM-32**U** DevKit (connettore IPEX) | 1 | 7 € | 7 € |
| 2 | Antenna WiFi 2.4 GHz IP67 + pigtail IPEX-SMA + presa pannello | omnidirezionale 7 dBi marina | 1 | 6 € | 6 € |
| 3 | Misuratore energia + TA toroidale | PZEM-004T v3 + TA 100A | 2 | 10 € | 20 € |
| 4 | Contattore 25 A 2NO con **bobina 12 V DC** | Finder 22.32.0.012.4320 | 2 | 20 € | 40 € |
| 5 | Driver MOSFET per bobina 12 V (logic-level) | IRLZ44N + R 220 Ω gate + diodo 1N4007 flyback | 2 | 2 € | 4 € |
| 6 | **Alimentatore AC/DC 12 V 10 W** (bobine + buck) | **HiLink HLK-10M12** (12V 10W, 833 mA) | 1 | 11 € | 11 € |
| 7 | Buck 12 V → 5 V per ESP32 + PZEM | MP1584EN regolabile | 1 | 2 € | 2 € |
| 8 | LED RGB pilotabile | WS2812B anello 12 LED | 1 | 2 € | 2 € |
| 9 | Sticker QR inox personalizzato | stampa custom UV+salino | 2 | 1 € | 2 € |
| 10 | Pulsante emergenza fungo NC | stop a fungo 22 mm IP66 | 1 | 8 € | 8 € |
| 11 | Morsettiera + DIN rail + accessori | kit DIN 35 mm con morsetti UK-2.5B | 1 | 8 € | 8 € |
| 12 | Cavo 2,5 mm² + fascette + cassetta interna IP66 (294×152×75) | Cavo H07V-K 100 m + cassetta Gewiss GW48007 | 1 | 12 € | 12 € |
| 13 | Sfiato a membrana M12 IP69 (ventilazione passiva) | Vent plug INOX + membrana PES anti-condensa | 1 | 8 € | 8 € |
| 14 | Sensore DS18B20 waterproof (monitor termico + protezione FW) | AZDelivery sonda INOX 1 m | 1 | 3 € | 3 € |
| 15 | **Kit pressacavi IP68** (per mantenere IP66 cassetta) | ARPDJK 32 pz misto M12/M16/M20/M25 | 1 | 10 € | 10 € |
| 16 | **Kit resistori 1/4 W assortiti** (pull-up 4,7 kΩ DS18B20 + 220 Ω gate MOSFET + scorta) | BOJACK 1000 pz, 25 valori, 5% | 1 | 9 € | 9 € |
|   | **TOTALE materiali per colonnina** | | | | **~152 €** |

> Differenziale 30 mA e magnetotermici 16 A sono **gia' presenti** nelle colonnine esistenti. La manodopera elettricista è gestita separatamente / internamente, quindi non è in BOM.

### Perché HLK-10M12 e non HLK-PM12?

Il vecchio HLK-PM12 dichiara 3 W → 250 mA @ 12 V. Calcolo del carico continuo lato 12 V:

| Carico | Potenza |
|---|---:|
| 2× bobina contattore Finder 22.32 (DC 1,6 W ciascuna) | 3,2 W |
| Buck MP1584 (uscita ~1,5 W @ η 85 %) | 1,8 W in ingresso |
| **Totale continuo** | **~5,0 W** |
| Inrush bobine in pickup (~3× per 50 ms) | picco ~10 W |

Il PM12 da 3 W è **sottodimensionato del 67 % a regime** e va in saturazione/protezione termica durante l'inrush simultaneo. L'**HLK-10M12 da 10 W (833 mA)** lavora al 50 % del nominale a regime, regge l'inrush, e ha lo stesso form-factor PCB. Nota: nessun "HLK-PM15" standard in catalogo HiLink; la serie 3 W si ferma al PM12 e il salto successivo è il 10M12.

### Perché pressacavi IP68 obbligatori

La cassetta Gewiss GW48007 è dichiarata IP66 **solo se** gli ingressi dei cavi sono sigillati con pressacavi della stessa classe (o superiore). Senza pressacavi, sui fori passanti per cavi 230 V / sensore / antenna l'umido salino entra e l'IP grade reale scende a IP20. Il kit ARPDJK contiene formati misti (M12 per DS18B20 e antenna, M16 per pulsante emergenza, M20 per 230 V monofase, M25 per cavi più grossi) — copre con margine i 5 ingressi tipici per cassetta.

### Perché 4,7 kΩ pull-up sul DS18B20

Il bus OneWire del DS18B20 funziona in collector-aperto: il sensore tira a massa per trasmettere `0`, ma per il `1` la linea deve essere riportata a Vcc da un resistore di pull-up esterno. Senza pull-up il bus resta flottante e il sensore non risponde. **4,7 kΩ tra DATA e +3,3 V** è il valore canonico del datasheet Maxim/Analog. Il kit BOJACK 1000 pz include resistori assortiti (anche il 220 Ω usato in serie ai gate dei MOSFET per limitare la corrente di switching), e costa meno di comprare i due valori singolarmente.

### Perché contattore + driver MOSFET e non solo modulo relè?
Vedi `13-faq-tecniche.md`. In sintesi: il modulo relè 5 V piloterebbe direttamente la bobina del contattore 230 V AC, ma il sistema è più affidabile e con meno componenti se usiamo un **contattore con bobina in bassa tensione DC (12 V)** comandato direttamente da un MOSFET pilotato dal GPIO. Niente alimentatori intermedi e niente click a 230 V.

## BOM "infrastruttura di molo" — rete 100% wireless

Niente cablaggi dati tra access point, niente switch PoE. Si copre il molo con un **mesh WiFi 6 outdoor** (TP-Link Deco X50-Outdoor IP65), che dialoga con il gateway internet (router LTE) e con il broker MQTT locale (Raspberry Pi).

| # | Componente | Modello consigliato | Q.tà | Prezzo unit. | Totale |
|---|---|---|---:|---:|---:|
| 1 | Router LTE industriale (gateway internet) | Teltonika RUT240 + antenne | 1 | 250 € | 250 € |
| 2 | SIM dati M2M 5 GB/anno | Vodafone Business / 1NCE | 1 | 60 € | 60 € |
| 3 | Access point mesh outdoor WiFi 6 AX3000 IP65 | **TP-Link Deco X50-Outdoor** | 3 | 150 € | 450 € |
| 4 | Broker MQTT locale + cache offline | Raspberry Pi 4 4GB + alimentatore + SD 64GB | 1 | 90 € | 90 € |
| 5 | Cassetta tecnica IP66 + UPS 12V (autonomia 4 h) | — | 1 | 200 € | 200 € |
| 6 | Pali / staffe outdoor per Deco | supporti palo | 3 | 25 € | 75 € |
|   | **TOTALE infrastruttura** | | | | **~1.125 €** |

### Note sulla rete wireless
- Il primo Deco X50-Outdoor è cablato in ethernet al router LTE (sta nella stessa cassetta tecnica).
- Gli altri 2-3 Deco si connettono in **mesh wireless**, ogni nodo richiede solo 230 V locale (presa schuko su palo).
- WiFi 6 AX3000, IP65, range fino a 70 m outdoor con linea di vista — su un molo di ~150 m bastano 2-3 nodi se la disposizione è lineare.
- Ogni colonnina si connette all'SSID del mesh: la rete è una sola, gestita da TP-Link Deco app o controller HOMESHIELD.

## BOM "cloud / backend" (canoni mensili)

| Voce | Provider | Costo |
|---|---|---:|
| VPS 4 vCPU / 8 GB / 80 GB SSD | Hetzner CX31 o Aruba | 13 €/mese |
| Backup off-site | Hetzner Storage Box | 4 €/mese |
| Dominio + certificati | Cloudflare / Let's Encrypt | 15 €/anno |
| Stripe fees | per transazione | 1,4 % + 0,25 € |
| **TOTALE OPEX cloud** | | **~17 €/mese + commissioni** |

## Riepilogo costi totali (esempio 50 colonnine)

| Voce | Costo |
|---|---:|
| 50 × materiali colonnina | 50 × 114 € ≈ 5.700 € |
| Infrastruttura di molo | 1.125 € |
| Sviluppo backend + app + admin (vedi `11-budget-stima.md`) | ~21.000 € (scenario freelance) |
| OPEX primo anno (cloud + SIM) | ~270 € |

Vedi `11-budget-stima.md` e il file `BOM_e_Budget_NauticaGLEM.xlsx` per il preventivo completo e la sensitivity sul numero di colonnine.

## Alternative valutate

| Hardware | Pro | Contro | Decisione |
|---|---|---|---|
| **ESP32-WROOM-32U + PZEM + contattore 12V** ✅ | Costo basso, antenna esterna risolve schermatura, bobina DC piu' affidabile | PZEM non MID → ok gestionale, KO fatturazione legale | Scelto per MVP |
| Contattore 230V AC + modulo relè 5V | piu' componenti standard | doppia tensione di controllo, bobina 230V invecchia | Scartato |
| Relè a stato solido SSR 25A 3-32V | un solo componente, vita infinita | dissipa calore con dissipatore, costo unitario 15 € | Buona alternativa, valutare in pilota |
| Shelly EM / Shelly Pro 4PM | Plug & play | Lock-in cloud Shelly, costo doppio | No |
| Eastron SDM230-MID + ESP32 | MID certificato, fatturabile | +40 €/colonnina + Modbus RS485 | Upgrade futuro se serve fatturazione |
| Soluzioni commerciali (Rolec, Marina Master) | Pronte, certificate marine | 800-1500 €/colonnina | No, troppo costose |

**Decisione finale (v2):** ESP32-U con antenna esterna + PZEM + contattore bobina 12 V DC + driver MOSFET. La cassetta interna IP65 contiene tutta la parte logica + driver; il contattore e i PZEM possono stare anche in cassettino separato vicino ai magnetotermici esistenti per ridurre EMI sui cavi UART.
