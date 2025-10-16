#include <Wire.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "secrets.h"

// OLED settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Firebase objects
FirebaseData fbdo;
FirebaseConfig config;
FirebaseAuth auth;

// Sensor pins
#define CO2_PIN 34
#define HUMIDITY_PIN 35

int co2Reading = 0;
int humidityReading = 0;
float carbonCredits = 0;
float emissions = 0;
bool offset = false;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // WiFi with Google DNS
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  
  // CRITICAL: Set Google DNS to fix DNS resolution
  WiFi.config(WiFi.localIP(), WiFi.gatewayIP(), WiFi.subnetMask(), 
              IPAddress(8, 8, 8, 8), IPAddress(8, 8, 4, 4));
  
  Serial.println("\n✅ WiFi Connected!");
  Serial.print("IP: "); Serial.println(WiFi.localIP());
  Serial.print("DNS: "); Serial.println(WiFi.dnsIP());

  // Firebase setup
  String host = String(DATABASE_URL);
  host.replace("https://", "");
  host.replace("http://", "");
  if (host.endsWith("/")) host.remove(host.length() - 1);
  
  config.database_url = host;
  config.signer.test_mode = true;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  Serial.print("Connecting to Firebase");
  int timeout = 20;
  while (!Firebase.ready() && timeout-- > 0) {
    delay(1000);
    Serial.print(".");
  }
  
  if (Firebase.ready()) {
    Serial.println("\n✅ Firebase Connected!");
  } else {
    Serial.println("\n❌ Firebase Timeout!");
  }

  // OLED setup
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("❌ OLED failed");
    for (;;);
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Carbon Credit");
  display.setCursor(0, 15);
  display.println("Monitor");
  display.setCursor(0, 35);
  display.println(Firebase.ready() ? "Status: OK" : "Status: ERROR");
  display.display();
  delay(2000);
}

void loop() {
  // Read sensors
  co2Reading = analogRead(CO2_PIN);
  humidityReading = analogRead(HUMIDITY_PIN);

  // Calculate credits
  carbonCredits = co2Reading * 0.5;
  emissions = humidityReading * 0.2;
  offset = (carbonCredits >= emissions);

  // Update OLED
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Carbon Credit");
  display.setCursor(0, 12);
  display.print("CO2: "); display.println(co2Reading);
  display.setCursor(0, 24);
  display.print("Humid: "); display.println(humidityReading);
  display.setCursor(0, 36);
  display.print("Credits: "); display.println(carbonCredits, 1);
  display.setCursor(0, 48);
  display.print("Offset: "); display.println(offset ? "YES" : "NO");
  display.display();

  // Serial output
  Serial.printf("CO2:%d Hum:%d Credits:%.1f Offset:%s\n",
                co2Reading, humidityReading, carbonCredits, 
                offset ? "YES" : "NO");

  // Upload to Firebase
  if (Firebase.ready()) {
    String path = "/carbon_data/" + String(millis());
    
    FirebaseJson json;
    json.set("co2", co2Reading);
    json.set("humidity", humidityReading);
    json.set("credits", carbonCredits);
    json.set("emissions", emissions);
    json.set("offset", offset);
    json.set("timestamp", millis());

    if (Firebase.setJSON(fbdo, path, json)) {
      Serial.println("  ✅ Uploaded to Firebase");
    } else {
      Serial.print("  ❌ Upload failed: ");
      Serial.println(fbdo.errorReason());
    }
  } else {
    Serial.println("  ⚠️ Firebase not ready");
  }

  delay(5000);
}