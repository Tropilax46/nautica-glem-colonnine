# 13 — FAQ tecniche

Risposte alle domande più frequenti emerse in fase di progetto.

---

## 1. Perché usare sia un contattore che un modulo relè?

È una **amplificazione in cascata** tra le tensioni in gioco:

| Stadio | Tensione / corrente | Componente |
|---|---|---|
| Logica | 3,3 V / max 12 mA per pin | ESP32 GPIO |
| Pilotaggio bobina | 5 V (50-70 mA) | Modulo relè SRD-05VDC opto-isolato |
| Potenza | 230 V / 16 A continui | Contattore Finder 22.32 |

L'ESP32 non può pilotare direttamente né la bobina del contattore (che richiede 230 V AC o 12 V DC) né i 16 A della presa. Il modulo relè fa da "amplificatore di potenza" tra il GPIO e la bobina del contattore. Il contattore vero serve perché:
- è dimensionato per **10⁶ cicli meccanici e 10⁵ elettrici a 16 A continui**;
- ha contatti argentati che reggono cariche induttive (caricabatterie barca);
- i moduli relè SRD-05 dichiarano 10 A ma si saldano con carichi prolungati.

### Alternative più pulite (v2)
**Opzione A — contattore con bobina 12 V DC + driver MOSFET** (adottata in v2 del BOM):
- ESP32 GPIO → resistore 220 Ω → gate di un MOSFET logic-level (es. IRLZ44N);
- drain → bobina contattore 12 V DC → +12 V;
- source → GND;
- diodo di flyback (1N4007) in parallelo alla bobina.
Vantaggi: zero contatti meccanici di basso livello, un solo alimentatore (12 V), bobina DC più affidabile in ambiente salino.

**Opzione B — relè a stato solido (SSR) 25 A 3-32 V DC**:
- ESP32 GPIO → direttamente all'ingresso SSR (senza modulo relè);
- output SSR → linea 230 V verso la presa.
Vantaggi: un solo componente, vita praticamente infinita, niente "click".
Svantaggi: dissipa calore (serve dissipatore a partire da ~10 A continui), costo ~15 €/canale.

---

## 2. Cosa alimenta l'alimentatore AC/DC 12 V (HLK-10M12)?

Tutta la parte di controllo + logica della colonnina, attraverso due rami:

**Ramo 12 V diretto:**
| Carico | Potenza |
|---|---:|
| Bobina contattore Finder 22.32 DC (×2) | 2 × 1,6 W = 3,2 W |
| Inrush in pickup (~3× per 50 ms) | picco istantaneo ~10 W |

**Ramo 5 V via buck MP1584EN:**
| Carico | Corrente @ 5 V |
|---|---:|
| ESP32 (WiFi attivo) | 150-250 mA |
| PZEM-004T parte digitale ×2 | 40 mA |
| LED WS2812 RGB | 20-60 mA |
| DS18B20 sensore termico | < 1 mA |
| **Totale a 5 V** | **~250-350 mA → ~1,5-1,8 W a 5 V** |

Il buck @ η 85 % consuma quindi ~1,8 W in ingresso lato 12 V.

**Totale a regime sull'HLK-10M12 = 3,2 + 1,8 ≈ 5 W continui**, picchi a ~10 W in pickup contattori.

### Perché NON l'HLK-PM12 (3 W) come pensato all'inizio
3 W = 250 mA @ 12 V. Solo le due bobine già assorbono 267 mA continui: il PM12 sarebbe **sottodimensionato del 67 %** a regime e andrebbe in protezione termica nei picchi di pickup simultaneo. Decisione v2.3: **upgrade a HLK-10M12 (10 W, 833 mA)** — stesso form-factor PCB, 50 % di utilizzo a regime, regge l'inrush. Nota: non esiste un "HLK-PM15" standard in catalogo HiLink (la serie PM si ferma al PM12); la prima taglia sopra è appunto la 10M12.

---

## 3. Il PZEM può avere errori di lettura: servirebbero due per presa?

**No.** Mettere 2 PZEM in parallelo non riduce gli errori, perché gli errori sono di tipo **sistematico**: due unità della stessa serie hanno la stessa calibrazione di fabbrica e gli stessi bias.

### Cosa dice il datasheet del PZEM-004T v3
- Precisione V: ±0,5 %
- Precisione A: ±0,5 %
- Precisione W: ±0,5 %
- **Precisione energia kWh: ±0,5 %**

Su una bolletta da 10 € l'errore tipico è ±5 cent. Sufficiente per fini **gestionali interni**, **non** per fatturazione fiscale (servirebbe certificazione MID).

### Da dove vengono in realtà gli errori "strani"
Quando si osservano letture incoerenti, il problema è quasi sempre **fisico**:
1. **TA toroidale mal installato**: freccia direzione sbagliata, o nel toroide c'è anche il neutro/altri cavi → corrente misurata vicino a zero.
2. **Cavo UART troppo lungo o non schermato**: a 9600 baud i pacchetti si corrompono → letture NaN o random.
3. **EMI da contattore vicino**: lo spike di apertura/chiusura interferisce con la linea UART.
4. **Alimentazione 5 V instabile**: l'HLK-PM01 al limite di corrente fa scendere la tensione → PZEM si resetta.

### Soluzioni reali
- TA dimensionato (100 A per prese 16 A va più che bene), serrato, con freccia verso il carico, **solo la fase nel toroide**.
- Cavo UART ≤ 30 cm, schermato se possibile, separato fisicamente dai 230 V.
- Posizionare il PZEM **non a contatto** con il contattore; cassettino separato dalla parte di potenza.
- Alimentatore 12 V dedicato (HLK-10M12, 10 W) + buck per 5 V, niente HLK-PM01 al limite.
- **Watchdog firmware**: se 3 letture consecutive sono NaN o > ±20 % rispetto alla media mobile a 1 minuto → flag `anomalia_presa`, stop sessione, notifica admin.

### Quando ha senso un secondo PZEM (o un MID)
Solo se vuoi emettere **fatture legali con i kWh certificati** (il cliente vede in fattura "X kWh certificati MID"). In quel caso non serve un secondo PZEM, serve **sostituire** il PZEM con un **Eastron SDM230-MID Modbus RS485**:
- ~50 €/colonnina (al posto dei 10 € del PZEM);
- certificazione MID Classe 1 (errore ≤ ±1 % conforme alla direttiva 2014/32/UE);
- interfaccia Modbus RTU su RS485 (servirà un convertitore TTL-RS485 lato ESP32).

Riassumendo: **doppio PZEM = doppio costo, zero beneficio**. Aggiorni a MID solo quando ti serve la valenza legale.

---

## 4. (Bonus) Come gestire la cassetta metallica della colonnina che fa da gabbia di Faraday?

Le colonnine da molo hanno spesso cassa in acciaio inox o alluminio: il WiFi 2,4 GHz dentro la cassetta è praticamente cancellato.

Soluzioni in ordine di costo:
1. **ESP32-WROOM-32U** (con connettore IPEX) + **antenna esterna omnidirezionale 5 dBi su connettore SMA** + **pigtail IPEX→SMA** + **presa pannello SMA femmina IP67** forata sul lato della colonnina. Costo ~6-8 €/colonnina. Soluzione adottata in v2 del BOM.
2. ESP32 standard con antenna PCB e **finestrella in plastica trasparente** sulla cassetta (poco estetico, lavorazione meccanica).
3. ESP32 fuori dalla cassetta in cassettino IP65 dedicato (separa logica da potenza, comodo per manutenzione).

Per le 30-80 colonnine la soluzione 1 è la più pulita: il foro per la presa SMA passante si fa con una semplice fustella da 6 mm e si sigilla con O-ring.

---

## 5. Il MOSFET dentro la cassetta va raffreddato? Soprattutto sotto sole siciliano.

**Risposta breve: no, il MOSFET no. Ma altri componenti sì, e la cassetta va progettata pensando al caldo.**

### Calcolo termico del MOSFET
Il MOSFET IRLZ44N pilota solo la bobina del contattore Finder 22.32 (consumo ~2,2 W a 12 V → ~180 mA continui), non i 16 A della presa.

| Parametro | Valore |
|---|---:|
| Corrente che attraversa il MOSFET | 0,18 A |
| RDS(on) a VGS = 5 V | 0,022 Ω |
| Potenza dissipata: P = I² × R | **0,7 mW** |
| θJA TO-220 senza dissipatore | 62 °C/W |
| Aumento di temperatura della giunzione | **+0,04 °C** |
| Tmax giunzione | 175 °C |

Il MOSFET funziona allo 0,001 % della sua capacità termica. Niente dissipatore, niente ventilazione locale. È volutamente sovradimensionato perché costa 0,40 € e dura per sempre così.

### Chi scalda davvero (dissipazione continua, entrambe le prese in uso)

| Sorgente | Potenza dissipata in calore |
|---|---:|
| 2× bobine contattore (mantenimento) | ~4,4 W |
| 2× contatti contattore 16 A (R ≈ 5 mΩ) | ~2,6 W |
| HLK-10M12 alimentatore (η 80 %, a ~5 W out) | ~1,2 W |
| ESP32 in WiFi | ~0,8 W |
| 2× PZEM digitale | ~0,5 W |
| Buck MP1584 + LED | ~0,3 W |
| **Totale steady-state** | **~9,6 W** |

In cassetta IP65 plastica da 2 L senza ventilazione, ambiente 40 °C esterno, sole diretto sulla colonnina metallica nera, l'interno raggiunge facilmente **65–75 °C**.

### Componenti realmente critici (limite operativo)

| Componente | T max operativa |
|---|---:|
| PZEM-004T | +60 °C |
| HLK-10M12 | +60 °C |
| Contattore Finder bobina | +60 °C |
| ESP32 | +85 °C |
| **MOSFET IRLZ44N** | **+175 °C** |

Quindi: PZEM, alimentatore e bobina del contattore sono i primi a soffrire. Il MOSFET è l'ultimo problema.

### Sei misure pratiche per la Sicilia (già nel BOM v2.2)

1. **Cassetta interna in ABS chiaro DENTRO la cassa metallica della colonnina**, non fuori. La cassa metallica fa scudo: il sole non scalda direttamente la plastica interna, e la temperatura scende di 10–15 °C rispetto a una cassetta esposta.
2. **Cassetta più grande del minimo**: Gewiss GW48007 (294×152×75) al posto di GW48006 (196×152×75). +50 % volume = dissipazione passiva maggiore.
3. **Sfiato a membrana IP69** (RS, ~8 €): vent plug M12 con membrana PES traspirante. Lascia uscire calore e umidità, mantiene IP65, blocca acqua e polvere. Anti-condensa.
4. **Separazione contattori ↔ logica**: contattori in cassettino DIN dedicato accanto ai magnetotermici esistenti, parte logica (ESP32 + PZEM + alimentatore) in cassetta separata sotto. I 7 W dei contattori non scaldano l'elettronica.
5. **Sensore DS18B20 waterproof** (~3 €) su GPIO ESP32 via OneWire: il firmware logga la temperatura interna ogni minuto e, sopra **70 °C**, apre i contattori e manda alert al server.
6. **Ventolina DC 12 V 40 mm con termostato** (~10 €, opzionale): solo se il pilota mostra temperature > 65 °C in agosto. Comandata dall'ESP32 con un secondo MOSFET.

### Riassunto operativo
| Domanda | Risposta |
|---|---|
| Il MOSFET va raffreddato? | No. |
| Serve un dissipatore? | No. |
| Va messo in cassettino separato? | Sì, ma per separare i contattori (caldi) dall'elettronica (sensibile). Non per il MOSFET. |
| Serve una ventola? | Solo se il pilota mostra T > 65 °C in agosto. |
| Cosa fa il firmware se la cassetta scalda troppo? | A 70 °C apre i contattori e manda alert. |

---

## 6. (Bonus) E se invece la cassa è in vetroresina?

Il problema non esiste: il WiFi passa. Si può usare ESP32-WROOM-32 standard con antenna PCB interna (risparmi i 6 € di antenna esterna), purché la cassetta non abbia placche metalliche schermanti accanto al modulo. Verificare la potenza ricevuta (RSSI) durante il sopralluogo.
