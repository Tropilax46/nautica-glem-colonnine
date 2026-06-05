/*
 * Nautica GLEM — Colonnina molo smart
 * Firmware ESP32 (versione 1.1.0 — gestione termica)
 *
 * Hardware:
 *   - ESP32-WROOM-32U (antenna esterna IP67)
 *   - 2 x PZEM-004T v3 (UART)
 *   - 2 x MOSFET IRLZ44N → bobina contattore Finder 22.32 (12 V DC)
 *   - 1 x WS2812B led status
 *   - 1 x pulsante emergenza fungo NC
 *   - 1 x DS18B20 waterproof per monitoraggio termico cassetta
 *
 * v1.1.0 (gestione termica):
 *   - Lettura DS18B20 ogni 30 s
 *   - Allarme se T > 65 °C (log + alert MQTT)
 *   - Auto-protezione se T > 70 °C: apre entrambi i contattori, ferma sessioni
 *   - Recovery automatico quando T scende sotto 60 °C (isteresi 10 °C)
 *
 * NOTA: questo è un firmware di partenza pensato per essere completato/testato
 *       prima dell'installazione. NON installare su impianto reale senza
 *       collaudo su banco di prova (vedere docs/03-firmware-esp32.md).
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>
#include <Preferences.h>
#include <Adafruit_NeoPixel.h>
#include <esp_task_wdt.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ---- Config ----------------------------------------------------------------
#define FIRMWARE_VERSION   "1.1.0"
#define WDT_TIMEOUT_S      30
#define TELEMETRY_PERIOD_MS 5000
#define THERMAL_CHECK_PERIOD_MS 30000

// Soglie termiche cassetta (gradi Celsius)
#define TEMP_WARN_C        65.0    // alert MQTT, LED ambra
#define TEMP_TRIP_C        70.0    // auto-protezione: apre contattori
#define TEMP_RECOVERY_C    60.0    // soglia di rientro (isteresi 10 °C)

// Pin
#define PIN_RELE1   25       // → gate MOSFET driver bobina K1
#define PIN_RELE2   26       // → gate MOSFET driver bobina K2
#define PIN_LED     14       // → WS2812B data
#define PIN_BTN_RST 0        // pulsante emergenza fungo NC (attivo LOW)
#define PIN_TEMP    27       // OneWire DS18B20
// IMPORTANTE: il bus OneWire del DS18B20 e' open-collector. Senza un resistore
// di pull-up esterno fra DATA e +3,3 V il sensore NON risponde (linea flottante).
// Cablaggio: 4,7 kOhm tra GPIO 27 e Vcc 3,3 V dell'ESP32 (vedi BOM riga 16).
// Alimentazione DS18B20: VCC = 3,3 V (NON 5 V, ESP32 GPIO non e' 5 V tolerant
// per i pin di input nominali). GND = GND ESP32.

// PZEM su due UART hardware
PZEM004Tv30 pzem1(Serial1, 16, 17);   // RX=16, TX=17
PZEM004Tv30 pzem2(Serial2, 18, 19);   // RX=18, TX=19

Adafruit_NeoPixel led(1, PIN_LED, NEO_GRB + NEO_KHZ800);

// Sensore termico DS18B20 su OneWire
OneWire oneWire(PIN_TEMP);
DallasTemperature thermo(&oneWire);

WiFiClientSecure wifiClient;
PubSubClient mqtt(wifiClient);
Preferences prefs;

// Stato termico globale
float lastTempC = 0.0;
bool  thermalTrip = false;          // true se contattori bloccati per overtemp
unsigned long lastThermalCheck = 0;

// ---- Stato runtime ---------------------------------------------------------
struct PresaState {
  bool on = false;
  String sessionId = "";
  float kWhStart = 0.0;
  float maxKWh   = 0.0;
};
PresaState presa[2];

String colonninaId;
String mqttHost;
uint16_t mqttPort = 8883;
String mqttUser, mqttPass;

unsigned long lastTelemetry = 0;

// ---- Helpers ---------------------------------------------------------------
void setLed(uint8_t r, uint8_t g, uint8_t b) {
  led.setPixelColor(0, led.Color(r, g, b));
  led.show();
}

void setRele(uint8_t n, bool on) {
  uint8_t pin = (n == 1) ? PIN_RELE1 : PIN_RELE2;
  digitalWrite(pin, on ? HIGH : LOW);
  presa[n - 1].on = on;
}

String topic(const char* suffix) {
  return "colonnine/" + colonninaId + "/" + suffix;
}

// ---- MQTT ------------------------------------------------------------------
void publishStatus() {
  StaticJsonDocument<256> doc;
  doc["online"] = true;
  doc["firmware"] = FIRMWARE_VERSION;
  doc["presa1"] = presa[0].on ? "erogating" : "idle";
  doc["presa2"] = presa[1].on ? "erogating" : "idle";
  doc["uptime"] = millis() / 1000;
  char buf[256];
  size_t n = serializeJson(doc, buf);
  mqtt.publish(topic("status").c_str(), buf, n);
}

void publishTelemetry(uint8_t n, PZEM004Tv30 &pzem) {
  float V  = pzem.voltage();
  float A  = pzem.current();
  float W  = pzem.power();
  float kWh = pzem.energy();
  float pf = pzem.pf();
  if (isnan(V) || isnan(A)) return;     // letture non pronte

  StaticJsonDocument<256> doc;
  doc["presa"] = n;
  doc["V"] = V; doc["A"] = A; doc["W"] = W;
  doc["kWh"] = kWh; doc["pf"] = pf;
  doc["session"] = presa[n - 1].sessionId;
  doc["ts"] = (uint32_t)(millis() / 1000);
  char buf[256];
  size_t l = serializeJson(doc, buf);
  mqtt.publish(topic("telemetry").c_str(), buf, l);

  // Safety cutoff per max_kwh
  PresaState &p = presa[n - 1];
  if (p.on && p.maxKWh > 0 && (kWh - p.kWhStart) >= p.maxKWh) {
    setRele(n, false);
    setLed(0, 255, 0);
  }
}

void onMqttMessage(char* t, byte* payload, unsigned int len) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload, len);
  if (err) return;

  const char* action = doc["action"] | "";
  uint8_t n = doc["presa"] | 0;
  if (n != 1 && n != 2) return;

  if (!strcmp(action, "on")) {
    presa[n - 1].sessionId = String((const char*)(doc["session"] | ""));
    presa[n - 1].maxKWh    = doc["max_kwh"] | 0.0f;
    if (thermalTrip) {
      // Cassetta troppo calda: rifiuto apertura
      StaticJsonDocument<128> ack;
      ack["session"] = sessId ? sessId : "";
      ack["presa"] = n;
      ack["result"] = "error";
      ack["reason"] = "thermal_trip";
      ack["temp_c"] = lastTempC;
      char buf[128];
      size_t l = serializeJson(ack, buf);
      mqtt.publish(topic("ack").c_str(), buf, l);
      return;
    }
    presa[n - 1].kWhStart  = (n == 1 ? pzem1.energy() : pzem2.energy());
    setRele(n, true);
    setLed(0, 0, 255);
  } else if (!strcmp(action, "off")) {
    setRele(n, false);
    presa[n - 1].sessionId = "";
    setLed(0, 255, 0);
  } else if (!strcmp(action, "reset_energy") && n) {
    if (n == 1) pzem1.resetEnergy(); else pzem2.resetEnergy();
  }

  // ack
  StaticJsonDocument<128> ack;
  ack["session"] = presa[n - 1].sessionId;
  ack["presa"] = n;
  ack["result"] = "ok";
  char buf[128];
  size_t l = serializeJson(ack, buf);
  mqtt.publish(topic("ack").c_str(), buf, l);
}

// ---- Monitoraggio termico cassetta ----------------------------------------
// La cassetta della colonnina, sotto sole siciliano, puo' superare i 60 °C.
// PZEM, alimentatore e bobina contattore hanno T max 60 °C, quindi:
//   - > 65 °C  → LED ambra + alert MQTT (warning)
//   - > 70 °C  → apre tutti i contattori, chiude le sessioni attive (trip)
//   - < 60 °C  → reset trip e ripresa normale (isteresi 10 °C)
void checkThermal() {
  thermo.requestTemperatures();
  float t = thermo.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C || t < -20 || t > 150) {
    // sensore scollegato / lettura non valida → non agire
    return;
  }
  lastTempC = t;

  StaticJsonDocument<128> doc;
  doc["temp_c"] = t;
  doc["state"] = thermalTrip ? "TRIP" : (t > TEMP_WARN_C ? "WARN" : "OK");
  char buf[128];
  size_t l = serializeJson(doc, buf);
  mqtt.publish(topic("thermal").c_str(), buf, l);

  if (!thermalTrip && t > TEMP_TRIP_C) {
    // SOGLIA SUPERATA: apre tutto e blocca nuove sessioni
    thermalTrip = true;
    setRele(1, false);
    setRele(2, false);
    presa[0].sessionId = "";
    presa[1].sessionId = "";
    setLed(255, 0, 0);   // rosso fisso
    StaticJsonDocument<128> alert;
    alert["event"] = "thermal_trip";
    alert["temp_c"] = t;
    char ab[128];
    size_t al = serializeJson(alert, ab);
    mqtt.publish(topic("alert").c_str(), ab, al);
  } else if (thermalTrip && t < TEMP_RECOVERY_C) {
    // Rientro: torno disponibile (le sessioni andranno riaperte da app)
    thermalTrip = false;
    setLed(0, 255, 0);   // verde libera
  } else if (!thermalTrip && t > TEMP_WARN_C) {
    setLed(255, 150, 0); // ambra warning
  }
}

void connectWifi() {
  setLed(255, 80, 0);
  WiFi.mode(WIFI_STA);
  WiFi.begin(prefs.getString("ssid").c_str(),
             prefs.getString("pass").c_str());
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) {
    delay(250);
    esp_task_wdt_reset();
  }
}

void connectMqtt() {
  wifiClient.setInsecure();      // sostituire con cert pinning in produzione
  mqtt.setServer(mqttHost.c_str(), mqttPort);
  mqtt.setCallback(onMqttMessage);
  while (!mqtt.connected()) {
    String cid = "col-" + colonninaId;
    if (mqtt.connect(cid.c_str(), mqttUser.c_str(), mqttPass.c_str(),
                     topic("status").c_str(), 1, true,
                     "{\"online\":false}")) {
      mqtt.subscribe(topic("cmd").c_str(), 1);
      publishStatus();
    } else {
      delay(2000);
      esp_task_wdt_reset();
    }
  }
}

// ---- Setup / Loop ----------------------------------------------------------
void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELE1, OUTPUT);
  pinMode(PIN_RELE2, OUTPUT);
  pinMode(PIN_BTN_RST, INPUT_PULLUP);
  digitalWrite(PIN_RELE1, LOW);
  digitalWrite(PIN_RELE2, LOW);

  led.begin();
  setLed(50, 0, 50);

  // Sensore termico DS18B20
  thermo.begin();
  thermo.setResolution(11);   // 11 bit ≈ 0,125 °C, ~375 ms conversione

  prefs.begin("glem", false);
  colonninaId = prefs.getString("id", "DEV-0000");
  mqttHost     = prefs.getString("mqtt_h", "mqtt.glem.local");
  mqttUser     = prefs.getString("mqtt_u", "");
  mqttPass     = prefs.getString("mqtt_p", "");

  esp_task_wdt_init(WDT_TIMEOUT_S, true);
  esp_task_wdt_add(NULL);

  connectWifi();
  connectMqtt();

  setLed(0, 255, 0);   // idle
}

void loop() {
  esp_task_wdt_reset();

  if (WiFi.status() != WL_CONNECTED) connectWifi();
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();

  if (millis() - lastTelemetry > TELEMETRY_PERIOD_MS) {
    publishTelemetry(1, pzem1);
    publishTelemetry(2, pzem2);
    publishStatus();
    lastTelemetry = millis();
  }

  if (millis() - lastThermalCheck > THERMAL_CHECK_PERIOD_MS) {
    checkThermal();
    lastThermalCheck = millis();
  }
}
