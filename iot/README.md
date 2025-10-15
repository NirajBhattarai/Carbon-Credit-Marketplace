# IoT CO2 Sensor Simulation

This folder contains the IoT simulation code for the Carbon Credit Marketplace project, specifically designed to work with Wokwi Arduino Simulator.

## Overview

The CO2 sensor simulation mimics real-world environmental monitoring devices that measure atmospheric CO2 levels, temperature, and humidity. This data is used for carbon credit calculations and environmental impact assessment.

## Files

- `co2-sensor-simulation.ino` - Main Arduino sketch for CO2 sensor simulation
- `wokwi-diagram.json` - Wokwi circuit diagram configuration
- `README.md` - This documentation file

## Hardware Simulation

The simulation includes the following components:

### ESP32 DevKit V1
- Main microcontroller
- WiFi connectivity for data transmission
- Analog and digital I/O pins

### MQ135 CO2 Sensor
- Simulates CO2 level detection
- Connected to analog pin A0
- Measures CO2 levels from 300-2000 ppm

### LED Indicator
- Red LED connected to GPIO2
- Indicates sensor status and alerts
- Blinks during initialization and alerts

### Buzzer
- Connected to GPIO3
- Provides audio alerts for high CO2 levels
- Different tones for different alert levels

### DHT22 Temperature & Humidity Sensor
- Connected to GPIO4
- Measures temperature and humidity
- Provides environmental context for CO2 readings

## Features

### Data Collection
- **CO2 Levels**: Continuous monitoring of atmospheric CO2
- **Temperature**: Environmental temperature readings
- **Humidity**: Air humidity measurements
- **Timestamps**: Precise timing for all measurements

### Alert System
- **High CO2 Alert**: Triggers when CO2 > 1000 ppm
- **Critical Alert**: Triggers when CO2 > 1500 ppm
- **Visual Indicators**: LED alerts
- **Audio Alerts**: Buzzer notifications

### Data Transmission
- **WiFi Connectivity**: Connects to Wokwi-GUEST network
- **HTTP API**: Sends data to backend server
- **JSON Format**: Structured data transmission
- **30-second intervals**: Regular data updates

### Carbon Footprint Calculation
- **Baseline Comparison**: Compares against 400 ppm baseline
- **Credit Calculation**: Converts excess CO2 to carbon credits
- **Real-time Processing**: Immediate calculations

## Setup Instructions

### 1. Wokwi Setup
1. Go to [Wokwi.com](https://wokwi.com)
2. Create a new project
3. Import the `wokwi-diagram.json` file
4. Copy the Arduino code from `co2-sensor-simulation.ino`

### 2. Backend Integration
1. Ensure your backend server is running on `localhost:3000`
2. Create the API endpoint `/api/sensor-data`
3. The endpoint should accept POST requests with JSON data

### 3. API Data Format
The sensor sends data in the following JSON format:

```json
{
  "deviceId": "CO2_SENSOR_1234",
  "co2Level": 450.25,
  "temperature": 22.5,
  "humidity": 45.0,
  "timestamp": 1234567890,
  "location": "Simulation Environment"
}
```

## Configuration

### Sensor Calibration
- **CO2 Range**: 300-2000 ppm
- **Baseline**: 400 ppm
- **Temperature Range**: 15-35°C
- **Humidity Range**: 20-70%

### Transmission Settings
- **Interval**: 30 seconds
- **Retry Logic**: Built-in error handling
- **Data Validation**: Range checking and validation

### Alert Thresholds
- **Warning Level**: 1000 ppm CO2
- **Critical Level**: 1500 ppm CO2
- **Alert Duration**: 500ms for warnings, 1s for critical

## Usage

### Running the Simulation
1. Upload the code to Wokwi
2. Start the simulation
3. Monitor serial output for sensor readings
4. Observe LED and buzzer alerts
5. Check backend for received data

### Monitoring Data
- **Serial Monitor**: Real-time sensor readings
- **LED Indicators**: Visual status updates
- **Audio Alerts**: Immediate notifications
- **Backend Logs**: Data transmission records

## Troubleshooting

### Common Issues
1. **WiFi Connection**: Ensure Wokwi-GUEST network is available
2. **Backend Connection**: Verify server is running and accessible
3. **Sensor Readings**: Check analog pin connections
4. **Alert System**: Verify LED and buzzer connections

### Debug Information
- Serial output provides detailed logging
- HTTP response codes indicate transmission status
- Error messages help identify issues

## Integration with Carbon Credit Marketplace

This IoT simulation provides the foundation for:

1. **Real-time Monitoring**: Continuous environmental data collection
2. **Carbon Credit Calculation**: Automated credit generation based on CO2 levels
3. **Alert Systems**: Immediate notification of environmental issues
4. **Data Analytics**: Historical data for trend analysis
5. **Marketplace Integration**: Direct connection to trading platform

## Future Enhancements

- **Multiple Sensors**: Support for additional environmental sensors
- **Machine Learning**: Predictive analytics for CO2 trends
- **Blockchain Integration**: Direct integration with carbon credit blockchain
- **Mobile App**: Real-time monitoring via mobile application
- **Historical Data**: Long-term data storage and analysis

## Support

For issues or questions regarding the IoT simulation:
1. Check the serial monitor output
2. Verify hardware connections in Wokwi
3. Ensure backend API is properly configured
4. Review error messages and debug information
