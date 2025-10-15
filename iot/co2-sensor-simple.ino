/**
 * CO2 Sensor Simulation for Carbon Credit Marketplace
 * Compatible with Wokwi Arduino Simulator
 * Simplified version for better compatibility
 */

#include <WiFi.h>
#include <HTTPClient.h>

// WiFi credentials (for simulation)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Backend API endpoint
const char* serverUrl = "http://localhost:3000/api/sensor-data";

// Sensor pins
const int CO2_SENSOR_PIN = A0;
const int LED_PIN = 2;
const int BUZZER_PIN = 3;

// Sensor calibration values
const float CO2_MIN = 300.0;  // Minimum CO2 level (ppm)
const float CO2_MAX = 2000.0; // Maximum CO2 level (ppm)
const float CO2_BASELINE = 400.0; // Baseline CO2 level (ppm)

// Data transmission interval (milliseconds)
const unsigned long TRANSMISSION_INTERVAL = 30000; // 30 seconds
unsigned long lastTransmission = 0;

// Global variables for sensor data
float co2Level = 0.0;
float temperature = 22.0;
float humidity = 45.0;
String deviceId = "CO2_SENSOR_1234";

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(CO2_SENSOR_PIN, INPUT);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize sensor
  initializeSensor();
  
  Serial.println("CO2 Sensor Simulation Started");
  Serial.println("Device ID: " + deviceId);
}

void loop() {
  // Read sensor data
  readSensorData();
  
  // Process and validate data
  processSensorData();
  
  // Display data on serial monitor
  displaySensorData();
  
  // Check for alerts
  checkForAlerts();
  
  // Send data to backend
  if (millis() - lastTransmission >= TRANSMISSION_INTERVAL) {
    sendDataToBackend();
    lastTransmission = millis();
  }
  
  delay(1000); // Wait 1 second before next reading
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.println("IP address: " + WiFi.localIP().toString());
}

void initializeSensor() {
  // Simulate sensor initialization
  Serial.println("Initializing CO2 sensor...");
  delay(2000);
  Serial.println("Sensor initialized successfully");
  
  // Blink LED to indicate initialization
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

void readSensorData() {
  // Simulate CO2 sensor reading
  int rawValue = analogRead(CO2_SENSOR_PIN);
  
  // Convert analog reading to CO2 level (simulation)
  co2Level = map(rawValue, 0, 1023, CO2_MIN, CO2_MAX);
  
  // Add some realistic variation
  co2Level += random(-50, 50);
  
  // Simulate temperature and humidity readings
  temperature = 20.0 + random(-5, 15); // 15-35°C
  humidity = 30.0 + random(-10, 40);   // 20-70%
}

void processSensorData() {
  // Ensure CO2 level is within valid range
  if (co2Level < CO2_MIN) {
    co2Level = CO2_MIN;
  } else if (co2Level > CO2_MAX) {
    co2Level = CO2_MAX;
  }
  
  // Round values to 2 decimal places
  co2Level = round(co2Level * 100) / 100.0;
  temperature = round(temperature * 100) / 100.0;
  humidity = round(humidity * 100) / 100.0;
}

void displaySensorData() {
  Serial.println("=== Sensor Data ===");
  Serial.println("Device ID: " + deviceId);
  Serial.println("CO2 Level: " + String(co2Level) + " ppm");
  Serial.println("Temperature: " + String(temperature) + " °C");
  Serial.println("Humidity: " + String(humidity) + " %");
  Serial.println("Timestamp: " + String(millis()));
  Serial.println("==================");
}

void checkForAlerts() {
  // Alert if CO2 level is too high
  if (co2Level > 1000) {
    Serial.println("ALERT: High CO2 level detected!");
    digitalWrite(LED_PIN, HIGH);
    tone(BUZZER_PIN, 1000, 500);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  
  // Alert if CO2 level is critically high
  if (co2Level > 1500) {
    Serial.println("CRITICAL ALERT: Dangerous CO2 level!");
    for (int i = 0; i < 5; i++) {
      tone(BUZZER_PIN, 2000, 200);
      delay(200);
    }
  }
}

void sendDataToBackend() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload manually (without ArduinoJson library)
    String jsonPayload = "{";
    jsonPayload += "\"deviceId\":\"" + deviceId + "\",";
    jsonPayload += "\"co2Level\":" + String(co2Level) + ",";
    jsonPayload += "\"temperature\":" + String(temperature) + ",";
    jsonPayload += "\"humidity\":" + String(humidity) + ",";
    jsonPayload += "\"timestamp\":" + String(millis()) + ",";
    jsonPayload += "\"location\":\"Simulation Environment\"";
    jsonPayload += "}";
    
    Serial.println("Sending data to backend...");
    Serial.println("Payload: " + jsonPayload);
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response Code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error sending data. HTTP Code: " + String(httpResponseCode));
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected. Cannot send data.");
  }
}

// Additional utility functions
float calculateCarbonFootprint() {
  // Simple carbon footprint calculation based on CO2 levels
  float excessCO2 = co2Level - CO2_BASELINE;
  if (excessCO2 > 0) {
    return excessCO2 * 0.001; // Convert to carbon credits
  }
  return 0.0;
}

void calibrateSensor() {
  Serial.println("Starting sensor calibration...");
  delay(5000); // Wait for sensor to stabilize
  Serial.println("Calibration complete");
}
