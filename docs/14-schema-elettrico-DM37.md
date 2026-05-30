# 14 — Schema elettrico per dichiarazione di conformità DM 37/08

> **Destinatario**: elettricista abilitato che redige la dichiarazione di conformità.
> **Scopo**: base testuale per il ridisegno in EPLAN / KiCad Schematic / AutoCAD Electrical.
> **Non sostituisce** lo schema grafico con simboli IEC 60617 firmato dal tecnico.
> **Versione**: 1.0 — derivata da `schemi/schema_elettrico_colonnina.mmd` v2.3 e `docs/02-hardware-bom.md` v2.3.

---

## 0 — Note di intestazione (frontespizio dello schema grafico)

| Voce | Valore |
|---|---|
| Committente | Nautica GLEM |
| Impianto | Colonnina molo smart — 2 prese 230 V + 2 prese idriche (idraulica esistente, fuori scopo) |
| Tensione nominale di esercizio (Un) | 230 V AC, 50 Hz, monofase L+N+PE |
| Corrente nominale per presa (In) | 16 A |
| Corrente totale colonnina | 32 A (2 prese × 16 A — limitata a monte dai magnetotermici esistenti) |
| Tensione SELV interna | 12 V DC (bobine contattori, alim. logica) e 5 V DC / 3,3 V DC (logica) |
| Grado di protezione cassetta interna | IP66 (Gewiss GW48007), con pressacavi IP68 obbligatori su tutti gli ingressi |
| Grado di protezione prese | IP67 (Schuko/CEE in uscita) |
| Differenziale | RCD tipo A, Idn ≤ 30 mA (esistente a monte) |
| Norme di riferimento | CEI 64-8 (parte 7, sez. 709 — porti turistici e analoghi); CEI EN 60446 (colori conduttori); CEI EN 61439 (quadri); CEI EN 60204-1 (per il circuito di arresto di emergenza); DM 37/08 |
| Cat. ambientale | Esterno a bordo molo, atmosfera salina, esposizione solare diretta — vedi `docs/13-faq-tecniche.md` per gestione termica |
| Comando di emergenza | Pulsante a fungo NC (S1), 22 mm IP66, interruzione hardware della linea SELV +12 V che alimenta le bobine dei contattori K1/K2 (apre simultaneamente entrambe le prese) |

> **Nota DM 37/08**: l'intervento è retrofit su impianto esistente. Verifica preliminare obbligatoria di: a) integrità della messa a terra, b) coordinamento del differenziale a monte (Idn ≤ 30 mA tipo A o B se in presenza di caricabatterie con componente DC), c) sezione conduttori e protezioni esistenti adeguate a 16 A continui per presa, d) coppia dei serraggi morsetti contattori e prese, e) test funzionale del pulsante di emergenza (cat. 0 secondo EN 60204-1: arresto per rimozione dell'alimentazione di controllo).

---

## 1 — Lista componenti (sigle IEC 81346)

### 1.1 Apparecchi di protezione e manovra di potenza (esistenti)

| Sigla | Descrizione | Modello/Caratteristiche | Note |
|---|---|---|---|
| RCD1 | Interruttore differenziale | Idn ≤ 30 mA, tipo A | Esistente a monte. **[DA VERIFICARE]**: se sulle prese sono collegati caricabatterie con raddrizzatore non a controllo PWM (componente DC residua), valutare upgrade a tipo B per CEI 64-8 sez. 531. |
| Q1 | Magnetotermico ramo presa 1 | Curva C, In = 16 A, 1P+N, 6 kA | Esistente. |
| Q2 | Magnetotermico ramo presa 2 | Curva C, In = 16 A, 1P+N, 6 kA | Esistente. **[DA VERIFICARE]**: dal `.mmd` originale risulta un solo magnetotermico che si dirama; per CEI 64-8 ogni circuito presa deve avere protezione dedicata. Verificare sul campo. |

### 1.2 Apparecchi di potenza nuovi

| Sigla | Descrizione | Modello | Caratteristiche elettriche |
|---|---|---|---|
| K1 | Contattore presa 1 | Finder 22.32.0.012.4320 | 2 NO, 25 A AC1, bobina 12 V AC/DC, 1,6 W in DC, A1/A2 |
| K2 | Contattore presa 2 | idem K1 | idem |
| MET1 | Misuratore energia presa 1 | PZEM-004T v3 + TA toroidale 100 A | Vin 80–260 V AC; uscita dati UART TTL 5 V, 9600 baud, RS=open-collector |
| MET2 | Misuratore energia presa 2 | idem MET1 | idem |
| XP1 | Presa 1 | Schuko o CEE-17 16 A IP67 | 230 V / 16 A, schermata UV/salino |
| XP2 | Presa 2 | idem XP1 | idem |

### 1.3 Alimentatori SELV

| Sigla | Descrizione | Modello | Caratteristiche |
|---|---|---|---|
| T1 | Alimentatore AC/DC primario | **HiLink HLK-10M12** | Vin 100–264 V AC; Vout 12 V DC, 10 W, 833 mA, isolato (SELV PELV), efficienza ~80 % |
| T2 | Convertitore DC/DC secondario | MP1584EN regolabile | Vin 4,5–28 V; Vout regolato 5,0 V DC, max 3 A; alimenta logica |

> **Nota terminologica**: nel testo del cliente compariva la sigla "HLK-PM15". Tale modello **non esiste** nel catalogo HiLink ufficiale. La famiglia HLK-PM si ferma al PM12 (3 W) — sottodimensionato per questo carico — e la prima taglia sopra è la serie XX-M-YY (es. HLK-10M12, 10 W). Lo schema usa HLK-10M12 come da BOM v2.3.

### 1.4 Componenti discreti di controllo bobine

| Sigla | Descrizione | Modello | Caratteristiche |
|---|---|---|---|
| V1 | MOSFET driver bobina K1 | IRLZ44N | N-channel logic-level, VDS 55 V, ID 47 A, RDS(on) 22 mΩ @ VGS 5 V, TO-220AB |
| V2 | MOSFET driver bobina K2 | idem V1 | idem |
| R1 | Resistenza in serie al gate V1 | carbonio o film 1/4 W, 220 Ω, ±5 % | Limita corrente di switching |
| R2 | Resistenza in serie al gate V2 | idem R1 | idem |
| D1 | Diodo flyback bobina K1 | 1N4007 | 1 A, 1000 V, ricombina la f.c.e.m. dell'induttore al rilascio |
| D2 | Diodo flyback bobina K2 | idem D1 | idem |

### 1.5 Controllo e segnalazione

| Sigla | Descrizione | Modello | Caratteristiche |
|---|---|---|---|
| A1 | Modulo microcontrollore | ESP32-WROOM-32U DevKit | Vcc 5 V via USB/VIN o 3,3 V via 3V3; WiFi 2,4 GHz su connettore IPEX |
| BT1 | Sensore temperatura cassetta | DS18B20 waterproof (sonda INOX 1 m) | Vcc 3,0–5,5 V; bus OneWire open-collector (RICHIEDE R3 esterna) |
| R3 | Resistenza pull-up OneWire | film 1/4 W, 4,7 kΩ, ±5 % | Tra GPIO 27 e linea +3,3 V |
| H1 | Indicatore luminoso di stato | WS2812B anello 12 LED RGB | Vcc 5 V; ingresso dati seriale single-wire |
| W1 | Antenna WiFi esterna | Omnidirezionale 5–7 dBi IP67, conn. SMA-M | Banda 2,4 GHz |

### 1.6 Sicurezza

| Sigla | Descrizione | Modello | Caratteristiche |
|---|---|---|---|
| S1 | Pulsante arresto di emergenza | Fungo NC 22 mm IP66, ad apertura positiva, sblocco a rotazione | Posizionato sul lato visibile della colonnina. Cat. 0 (rimozione alimentazione di controllo) secondo EN 60204-1. |

### 1.7 Accessori meccanici (non in schema elettrico ma necessari per IP)

- 32 pz pressacavi IP68 misti M12/M16/M20/M25 (kit ARPDJK)
- 1 pz sfiato a membrana M12 IP69 (PES, anti-condensa)
- 1 pz cassetta Gewiss GW48007 IP66 294×152×75 mm con guida DIN
- 1 pz cassetta colonnina esterna (metallo, esistente)

---

## 2 — Sezione A: Alimentazione 230 V AC (potenza)

### 2.1 Linea di ingresso

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| Rete molo / linea esistente — L | RCD1 / L | 2,5 mm² | Marrone | Esistente |
| Rete molo / linea esistente — N | RCD1 / N | 2,5 mm² | Blu | Esistente |
| Rete molo / linea esistente — PE | Barra equipotenziale | 4 mm² | Giallo/verde | Esistente |

### 2.2 Da RCD1 ai magnetotermici (esistente)

| Da | A | Sezione | Colore |
|---|---|---|---|
| RCD1 / L (carico) | Q1 / L · Q2 / L · T1 / L | 2,5 mm² | Marrone |
| RCD1 / N (carico) | Q1 / N · Q2 / N · T1 / N | 2,5 mm² | Blu |
| Barra PE | Carcassa metallica colonnina | 4 mm² | Giallo/verde |

### 2.3 Ramo presa 1 — circuito di potenza

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| Q1 / L (uscita) | K1 / 1 (ingresso polo 1) | 2,5 mm² | Marrone |  |
| K1 / 2 (uscita polo 1) | TA toroidale MET1 (passaggio fase) → MET1 / "L IN" | 2,5 mm² | Marrone | TA va inserito su un solo cavo (la fase) con freccia verso il carico |
| MET1 / "L OUT" | XP1 / L (terminale presa) | 2,5 mm² | Marrone |  |
| Q1 / N (uscita) | K1 / 3 (ingresso polo 2) | 2,5 mm² | Blu |  |
| K1 / 4 (uscita polo 2) | MET1 / "N" → XP1 / N | 2,5 mm² | Blu |  |
| Barra PE | XP1 / PE | 2,5 mm² | Giallo/verde |  |

### 2.4 Ramo presa 2 — circuito di potenza

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| Q2 / L (uscita) | K2 / 1 | 2,5 mm² | Marrone |  |
| K2 / 2 | TA toroidale MET2 → MET2 / "L IN" → XP2 / L | 2,5 mm² | Marrone |  |
| Q2 / N (uscita) | K2 / 3 → K2 / 4 → MET2 / "N" → XP2 / N | 2,5 mm² | Blu |  |
| Barra PE | XP2 / PE | 2,5 mm² | Giallo/verde |  |

### 2.5 Alimentazione del trasformatore di servizio

| Da | A | Sezione | Colore | Protezione |
|---|---|---|---|---|
| RCD1 / L | T1 / L (HLK-10M12) | 1,5 mm² | Marrone | Si raccomanda fusibile dedicato F1: 500 mA, 250 V AC, tipo T (ritardato), portafusibile 5×20 mm su DIN |
| RCD1 / N | T1 / N | 1,5 mm² | Blu |  |

> **[DA VERIFICARE]**: la presenza di F1 dedicato per T1 è una buona pratica suggerita dal manuale HLK-10M12 ma **non è esplicita nel BOM v2.3**. Aggiungere portafusibile + fusibile T500mA se l'elettricista concorda.

---

## 3 — Sezione B: Alimentazione SELV 12 V DC

### 3.1 Uscita primaria HLK-10M12

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| T1 / "+V" (12 V) | Nodo SELV_12V_PLUS | 0,75 mm² | Rosso | Linea continua 12 V |
| T1 / "-V" (GND) | Nodo SELV_12V_GND | 0,75 mm² | Nero | GND comune SELV |

### 3.2 Inserzione del pulsante di emergenza S1 sulla linea +12 V

**Concetto safety (cat. 0 EN 60204-1)**: il fungo NC interrompe FISICAMENTE l'alimentazione delle bobine, **indipendentemente dal firmware**. L'apertura del contatto NC apre entrambi i contattori istantaneamente.

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| Nodo SELV_12V_PLUS | S1 / 11 (NC, morsetto comune) | 0,75 mm² | Rosso |  |
| S1 / 12 (NC, contatto in uscita) | Nodo SELV_12V_PLUS_INT (dopo S1) | 0,75 mm² | Rosso | Il "_INT" indica la linea già passata per il fungo |

### 3.3 Distribuzione 12 V dopo S1

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| SELV_12V_PLUS_INT | K1 / A1 (bobina +) | 0,5 mm² | Rosso |  |
| SELV_12V_PLUS_INT | K2 / A1 (bobina +) | 0,5 mm² | Rosso |  |
| SELV_12V_PLUS_INT | T2 / VIN+ (buck MP1584EN) | 0,75 mm² | Rosso |  |
| SELV_12V_GND | T2 / VIN− | 0,75 mm² | Nero |  |

### 3.4 Lato low del MOSFET (return delle bobine)

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| K1 / A2 (bobina −) | V1 / Drain (D) | 0,5 mm² | Nero |  |
| V1 / Source (S) | SELV_12V_GND | 0,5 mm² | Nero |  |
| K2 / A2 | V2 / Drain | 0,5 mm² | Nero |  |
| V2 / Source | SELV_12V_GND | 0,5 mm² | Nero |  |

### 3.5 Diodi flyback in parallelo alle bobine

| Da | A | Note |
|---|---|---|
| D1 / catodo (banda) | K1 / A1 (+12 V dopo S1) | Diodo orientato verso il +; assorbe lo spike negativo al rilascio della bobina |
| D1 / anodo | K1 / A2 (drain V1) |  |
| D2 / catodo | K2 / A1 |  |
| D2 / anodo | K2 / A2 (drain V2) |  |

> **Nota di buona pratica**: i diodi vanno cablati il più vicino possibile ai morsetti bobina del contattore, **non** ai morsetti del MOSFET, per minimizzare l'anello di induttanza.

---

## 4 — Sezione C: Alimentazione SELV 5 V DC

### 4.1 Uscita buck MP1584EN

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| T2 / "+V OUT" (5 V regolato) | Nodo SELV_5V_PLUS | 0,5 mm² | Rosso | Tarare T2 a 5,00 V con trimmer prima di alimentare la logica |
| T2 / "−V OUT" | Nodo SELV_5V_GND (comune a SELV_12V_GND) | 0,5 mm² | Nero |  |

### 4.2 Distribuzione 5 V

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| SELV_5V_PLUS | A1 / VIN (5 V ESP32) | 0,5 mm² | Rosso | DevKit accetta 5 V su pin VIN; LDO interno scende a 3,3 V |
| SELV_5V_PLUS | MET1 / Vcc | 0,22 mm² | Rosso | Modulo PZEM lato logico |
| SELV_5V_PLUS | MET2 / Vcc | 0,22 mm² | Rosso |  |
| SELV_5V_PLUS | H1 / Vcc (WS2812B 5V) | 0,5 mm² | Rosso | 12 LED a piena luce assorbono fino a 720 mA: prevedere capacità di disaccoppiamento |
| SELV_5V_GND | A1 / GND · MET1 / GND · MET2 / GND · H1 / GND | 0,5 mm² | Nero | GND comune SELV (single point) |

### 4.3 Linea 3,3 V derivata dall'ESP32

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| A1 / 3V3 (uscita LDO interno ESP32) | BT1 / Vcc (DS18B20) | 0,22 mm² | Arancione | Tensione 3,3 V — il DS18B20 funziona ma NON usare 5 V, altrimenti il pin GPIO 27 non è 5 V tolerant |
| A1 / 3V3 | R3 / pin1 (pull-up) | 0,22 mm² | Arancione |  |
| R3 / pin2 | Nodo OneWire DATA | 0,22 mm² | Arancione |  |

---

## 5 — Sezione D: Segnali di controllo e dati

### 5.1 Comando MOSFET (digitale ESP32 → gate)

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| A1 / GPIO 25 (PIN_RELE1) | R1 / pin1 | 0,22 mm² | Giallo |  |
| R1 / pin2 | V1 / Gate | 0,22 mm² | Giallo | R1 = 220 Ω limita la corrente di switching |
| A1 / GPIO 26 (PIN_RELE2) | R2 / pin1 | 0,22 mm² | Giallo |  |
| R2 / pin2 | V2 / Gate | 0,22 mm² | Giallo |  |

> **[DA VERIFICARE — incongruenza tra `.mmd` e firmware]**: il file `schemi/schema_elettrico_colonnina.mmd` riportava "GPIO 32/33 → gate". Il firmware `firmware/colonnina_smart.ino` (riga 47–48, fonte autoritativa) usa **GPIO 25 e 26**. Lo schema elettrico segue il firmware. Da allineare il `.mmd` in una revisione successiva.

### 5.2 Comunicazione UART verso PZEM

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| A1 / GPIO 16 (RX Serial1) | MET1 / TX | 0,22 mm² | Verde | RX su ESP32 = TX su PZEM |
| A1 / GPIO 17 (TX Serial1) | MET1 / RX | 0,22 mm² | Bianco | Cross-over UART |
| A1 / GPIO 18 (RX Serial2) | MET2 / TX | 0,22 mm² | Verde |  |
| A1 / GPIO 19 (TX Serial2) | MET2 / RX | 0,22 mm² | Bianco |  |

> **[DA VERIFICARE — incongruenza tra `.mmd` e firmware]**: il `.mmd` riportava per PZEM #2 "UART SW 25/26". Il firmware usa **Serial2 hardware su GPIO 18/19**. Lo schema elettrico segue il firmware perché un secondo UART hardware è più affidabile della software-serial; i GPIO 25/26 sono già occupati dai gate MOSFET (vedi 5.1). Da allineare il `.mmd`.

### 5.3 Sensore temperatura DS18B20

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| A1 / 3V3 | BT1 / Vcc (filo rosso del cavo sonda) | 0,22 mm² | Arancione | Vedi 4.3 |
| A1 / GND | BT1 / GND (filo nero) | 0,22 mm² | Nero |  |
| A1 / GPIO 27 (PIN_TEMP) | BT1 / DATA (filo giallo o bianco) | 0,22 mm² | Giallo |  |
| (in parallelo) R3 = 4,7 kΩ | tra GPIO 27 e 3,3 V | — | — | Pull-up obbligatorio bus OneWire |

### 5.4 LED indicatore WS2812B

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| A1 / GPIO 14 (PIN_LED) | H1 / DI (data in) | 0,22 mm² | Giallo | Verificare che il livello logico 3,3 V dell'ESP32 sia compatibile con DI a 5 V: se H1 non risponde, inserire level-shifter o un 74AHCT125 |
| SELV_5V_PLUS | H1 / Vcc | 0,5 mm² | Rosso | Vedi 4.2 |
| SELV_5V_GND | H1 / GND | 0,5 mm² | Nero |  |

> **[DA VERIFICARE]**: il livello logico 3,3 V dell'ESP32 funziona spesso con WS2812B ma è fuori specifica (datasheet richiede VIH ≥ 0,7·Vcc = 3,5 V @ 5 V). Per affidabilità in ambiente marino prevedere un level-shifter mono-canale 74AHCT1G125 oppure alimentare H1 a 3,3 V invece che a 5 V (ridotta intensità ma logica compatibile). Decisione da prendere in fase pilota.

### 5.5 Pulsante emergenza S1 — segnalazione stato all'ESP32

Oltre all'interruzione hardware del +12 V (vedi 3.2), il fungo va anche letto dal firmware per inviare allarme MQTT.

| Da | A | Sezione | Colore | Note |
|---|---|---|---|---|
| S1 / 21 (secondo contatto NC, comune) | A1 / GPIO 0 (PIN_BTN_RST) | 0,22 mm² | Grigio | GPIO con pull-up interno → fungo premuto = LOW |
| S1 / 22 (secondo contatto NC, uscita) | A1 / GND | 0,22 mm² | Nero |  |

> **[DA VERIFICARE]**: S1 deve avere **due blocchi NC** (uno per interrompere +12 V, uno per segnalare a ESP32 senza dipendenza dal +12 V stesso). Il modello indicato in BOM ("Pulsante rosso 1NO+1NC IP66 con cassetta") ha **un solo NC** + un NO. Opzioni:
> - **(a)** sostituire con fungo a 2 NC (più costoso, più sicuro);
> - **(b)** usare il NC per il +12 V (priorità safety) e leggere lo stato indirettamente dall'ESP32 monitorando i consumi (se le bobine sono spente da S1 hardware, il firmware lo rileva dal MOSFET driver e dal PZEM);
> - **(c)** usare il NO in parallelo per generare un impulso a ESP32 quando il fungo è premuto (con pull-down esterno).
> Decisione consigliata: **(b)** — più semplice e già supportata dal firmware (verifica dello stato delle bobine).

### 5.6 Antenna WiFi

| Da | A | Note |
|---|---|---|
| A1 / connettore IPEX (u.FL) | Pigtail IPEX↔SMA-F (~10 cm) → bulkhead SMA-F passante sulla parete cassetta IP66 | Connessione coassiale 50 Ω |
| Bulkhead SMA-M esterno | W1 / SMA-M (antenna omnidirezionale 5–7 dBi IP67) | Avvitato fuori cassetta |

---

## 6 — Tabella sinottica delle protezioni e dei coordinamenti

| Linea | Tensione | Iu | Protezione | Sezionamento |
|---|---|---|---|---|
| Linea di ingresso colonnina | 230 V AC | 32 A | RCD1 30 mA tipo A (esistente) + Q1/Q2 16 A C (esistenti) | Differenziale e magnetotermici a monte |
| Ramo XP1 | 230 V AC | 16 A | Q1, RCD1 | Contattore K1 (apertura comandata) |
| Ramo XP2 | 230 V AC | 16 A | Q2, RCD1 | Contattore K2 (apertura comandata) |
| Ramo alimentazione T1 | 230 V AC | <0,5 A | RCD1 + (raccomandato F1 T500mA su DIN) | nessun sezionatore dedicato — togliere alimentazione generale |
| Ramo SELV 12 V (bobine) | 12 V DC | <0,5 A | nessuna (T1 ha protezione interna corto-circuito) | **S1 (fungo emergenza)** apre entrambe le bobine |
| Ramo SELV 5 V (logica) | 5 V DC | <1 A | T2 ha protezione interna corto-circuito | nessun sezionatore — dipende da T1 |

---

## 7 — Cablaggi meccanici e gradi IP

1. Tutti gli ingressi cavi nella cassetta Gewiss GW48007 vanno realizzati con pressacavi IP68 di dimensione adeguata al diametro del cavo:
   - 2 × M20 per cavi 230 V multipolari 3×2,5 mm² (uno per ingresso, due per uscita verso XP1 e XP2) — totale 3 pressacavi M20
   - 1 × M16 per cavo pulsante S1 (multipolare schermato 4×0,22 mm²)
   - 1 × M12 per cavo DS18B20
   - 1 × M12 per il bulkhead SMA dell'antenna
   - 1 × M12 dedicato al solo sfiato a membrana (PES IP69)
2. La cassetta esterna metallica della colonnina deve essere collegata a PE tramite cavo dedicato giallo/verde sez. 4 mm², con vite-faston M5 sull'inox.
3. La distanza tra parti attive 230 V e parti SELV deve essere ≥ 8 mm in aria e ≥ 8 mm su supporto (CEI EN 61140); in caso di promiscuità di binario DIN usare separatori isolanti certificati.
4. Cavi UART e OneWire devono essere **schermati** o tenuti **a distanza ≥ 30 mm dai 230 V**, con percorsi paralleli minimizzati; lo schermo va connesso a GND lato ESP32 (single-point).

---

## 8 — Sequenza operativa (logica funzionale, per il collaudo)

1. Chiusura RCD1 → Q1/Q2 → presenza 230 V al monte di K1, K2 e a T1.
2. T1 si avvia → presenza 12 V su SELV_12V_PLUS (verificare 11,5–12,5 V dopo S1 = "_INT").
3. T2 si avvia → presenza 5 V su SELV_5V_PLUS (taratura iniziale del trimmer a 5,00 V prima del primo collegamento di A1).
4. A1 (ESP32) si avvia, esegue self-test (lettura BT1, ping MET1/MET2 via UART, blink iniziale H1).
5. A1 connette WiFi (W1) al mesh del molo e si registra al broker MQTT.
6. Su comando `cmd:on` da MQTT: A1 alza GPIO 25 (o 26) → V1 (o V2) conduce → la bobina K1 (o K2) si chiude → 230 V alla presa XP1 (o XP2). Il diodo D1/D2 protegge V1/V2 al rilascio.
7. Allo stesso tempo il MET1 (o MET2) inizia a misurare i kWh erogati e pubblica telemetria ogni 5 s.
8. **Test arresto di emergenza**: con presa attiva, premere S1: la linea +12 V su SELV_12V_PLUS_INT si apre, entrambe le bobine si rilasciano simultaneamente, le prese si scollegano. L'ESP32 resta alimentato dai 5 V e pubblica l'evento `thermal_trip`/`emergency_trip` sul broker. Rotazione di S1 per ripristinare.
9. **Test protezione termica firmware**: se BT1 misura T > 70 °C, A1 pone GPIO 25 e 26 a LOW → contattori si aprono indipendentemente da S1.

---

## 9 — Test e collaudo obbligatori (CEI 64-8 / DM 37/08)

| Test | Strumento | Esito atteso |
|---|---|---|
| Continuità del conduttore di protezione | multimetro / tester | R ≤ 1 Ω tra PE colonnina e barra equipotenziale |
| Resistenza di isolamento 230 V → SELV / PE | megger 500 V DC | R ≥ 1 MΩ |
| Tempo di intervento RCD1 a Idn | tester RCD | t ≤ 300 ms a 1×Idn |
| Verifica polarità prese XP1/XP2 | tester prese o sequenza-scopio | L-N-PE corretti, no inversioni |
| Verifica isolamento doppio/rinforzato lato SELV | ispezione + megger | nessun contatto accidentale 230 V ↔ SELV |
| Test funzionale S1 (arresto di emergenza) | manuale, con presa sotto carico | apertura immediata di entrambe le prese; ripristino solo dopo rotazione di S1 |
| Test allarme termico (T > 70 °C) | phon o forno termostato | apertura prese, alert MQTT, riarmo automatico sotto 60 °C |
| Lettura energetica PZEM contro contatore di riferimento | carico noto (1 kW × 30 min) | scarto ≤ ±1 % (PZEM è ±0,5 % dichiarato) |
| IP66 della cassetta | ispezione visiva e test acqua spruzzata | nessuna penetrazione, pressacavi serrati |

---

## 10 — Documentazione da allegare alla dichiarazione di conformità

1. Schema elettrico unifilare e multifilare disegnato in EPLAN/KiCad/AutoCAD Electrical (a partire da questo documento).
2. Schema a blocchi del sistema (vedi `schemi/architettura_sistema.mmd`).
3. Datasheet dei componenti principali: HLK-10M12, Finder 22.32, IRLZ44N, PZEM-004T v3.
4. Certificazioni CE / RoHS dei componenti.
5. Relazione tecnica con calcolo della corrente di corto circuito e coordinamento delle protezioni a monte.
6. Verifica della selettività con il differenziale del quadro generale del molo.
7. Verbale dei test di collaudo compilato e firmato.
8. Dichiarazione di rispondenza (se intervento su impianto esistente con documentazione mancante) oppure di conformità (se progetto ex novo) — DM 37/08 art. 7.

---

## Appendice — Riepilogo nodi (per il netlist EPLAN)

```
NODI 230 V AC
  LINE_L      = uscita rete molo / fase
  LINE_N      = uscita rete molo / neutro
  PE          = barra di terra
  L_AFTER_Q1  = uscita magnetotermico ramo 1
  L_AFTER_Q2  = uscita magnetotermico ramo 2
  L_TO_XP1    = dopo contattore K1 e PZEM MET1
  L_TO_XP2    = dopo contattore K2 e PZEM MET2

NODI SELV 12 V DC
  SELV_12V_PLUS      = uscita T1, prima di S1
  SELV_12V_PLUS_INT  = dopo S1 (verso bobine e buck)
  SELV_12V_GND       = GND comune SELV

NODI SELV 5 V DC
  SELV_5V_PLUS       = uscita T2
  SELV_5V_GND        = comune a SELV_12V_GND (single-point)

NODI 3,3 V e SEGNALI
  ESP_3V3            = uscita LDO interno ESP32 (per DS18B20 e R3)
  OW_DATA            = nodo OneWire (GPIO 27, BT1/DATA, R3/pin2)
  GATE_K1            = tra R1 e V1/G
  GATE_K2            = tra R2 e V2/G
  UART1_RX / UART1_TX, UART2_RX / UART2_TX
  LED_DATA           = GPIO 14 → H1/DI
  EMERG_SIG          = GPIO 0 (lettura stato S1)
```

---

**Note finali / cose da chiarire con l'elettricista prima di disegnare**:

- **[DA VERIFICARE 1]** Esistono già 2 magnetotermici separati per le 2 prese o uno solo a monte? Vedi 1.1 → Q1/Q2.
- **[DA VERIFICARE 2]** Il differenziale RCD1 esistente è tipo A o B? Per i caricabatterie con elettronica potrebbe essere richiesto il tipo B.
- **[DA VERIFICARE 3]** Va aggiunto F1 (fusibile T500mA) a protezione dell'ingresso T1? Buona pratica ma non in BOM v2.3.
- **[DA VERIFICARE 4]** Il fungo S1 ha 1 o 2 blocchi NC? Vedi 5.5 per le 3 opzioni proposte.
- **[DA VERIFICARE 5]** Allineamento GPIO ESP32 tra firmware (autoritativo) e schemi `.mmd` (vedi 5.1 e 5.2). Aggiornare il `.mmd` in revisione successiva.
- **[DA VERIFICARE 6]** WS2812B a 3,3 V o level-shifter? Vedi 5.4.
