#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// OLED settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Simulated sensor pins
#define CO2_PIN 34
#define HUMIDITY_PIN 35

int co2Reading = 0;
int humidityReading = 0;
float carbonCredits = 0;
float emissions = 0;
bool offset = false;

void setup() {
  Serial.begin(115200);

  // Initialize OLED
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)){
    Serial.println("OLED allocation failed");
    for(;;);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.println("Carbon Credit Monitor");
  display.display();
  delay(1000);
}

void loop() {
  // Read sensors
  co2Reading = analogRead(CO2_PIN);        // CO2 sensor
  humidityReading = analogRead(HUMIDITY_PIN); // Humidity sensor

  // Simple carbon credit calculation
  carbonCredits = co2Reading * 0.5;    // simulated formula
  emissions = humidityReading * 0.2;   // simulated formula
  offset = (carbonCredits >= emissions);

  // Display on OLED
  display.clearDisplay();
  display.setCursor(0,0);
  display.println("Carbon Credit Project");
  display.setCursor(0,15);
  display.print("CO2 Level: "); display.println(co2Reading);
  display.setCursor(0,30);
  display.print("Humidity: "); display.println(humidityReading);
  display.setCursor(0,45);
  display.print("Credits: "); display.println(carbonCredits);
  display.setCursor(0,55);
  display.print("Offset: "); display.println(offset ? "Yes" : "No");
  display.display();

  // Serial Monitor log
  Serial.print("CO2: "); Serial.print(co2Reading);
  Serial.print(" | Humidity: "); Serial.print(humidityReading);
  Serial.print(" | Credits: "); Serial.print(carbonCredits);
  Serial.print(" | Offset: "); Serial.println(offset ? "Yes" : "No");

  delay(1000);
}
