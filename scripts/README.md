# MQTT Data Simulator

This script simulates multiple companies with applications, API keys, and IoT devices sending continuous data to the MQTT broker to demonstrate the sequester-only carbon credit system.

## Structure

- **5 Companies** with unique wallet addresses
- **Each company has 1 application**
- **Each application has 10 API keys**
- **Each API key is associated with 5-10 IoT devices**
- **All devices are SEQUESTER type** (no emitters)

## Companies Simulated

1. **EcoTech Solutions** - Advanced carbon sequestration technology
2. **GreenForest Corp** - Forest carbon monitoring and sequestration
3. **OceanClean Industries** - Ocean-based carbon sequestration systems
4. **UrbanGreen Systems** - Urban carbon capture and monitoring
5. **AgriCarbon Ltd** - Agricultural carbon sequestration technology

## Data Types Sent

### Sensor Data (every 10-30 seconds)
- CO2 levels (reduced through sequestration)
- Temperature and humidity readings
- Carbon credits earned
- Device status and metrics

### Heartbeat Data (every 60-120 seconds)
- Device online status
- Uptime and performance metrics
- Battery and resource usage

### Alert Data (5% chance every 5 minutes)
- Maintenance alerts
- Calibration notifications
- Performance degradation warnings

## Usage

### Prerequisites

Make sure you have:
1. MQTT broker running (default: `ws://localhost:9001`)
2. Carbon Credit Marketplace running
3. Node.js installed

### Running the Simulator

```bash
# Install dependencies (if not already installed)
npm install

# Run the simulator
npm run simulate

# Run in development mode (auto-restart on changes)
npm run simulate:dev
```

### Environment Variables

You can configure the MQTT broker connection:

```bash
export MQTT_BROKER="ws://your-mqtt-broker:9001"
export MQTT_USERNAME="your-username"
export MQTT_PASSWORD="your-password"
```

## MQTT Topics

The simulator publishes to these topic patterns:

- `carbon_credit/{apiKey}/sensor_data` - Sensor readings
- `carbon_credit/{apiKey}/heartbeat` - Device heartbeat
- `carbon_credit/{apiKey}/alert` - Device alerts

## Sample Data Structure

```json
{
  "device_id": "DEV_01_01_01",
  "device_type": "SEQUESTER",
  "type": "sequester",
  "mac": "a1b2c3d4e5f6",
  "ip": "192.168.1.100",
  "location": "EcoTech Solutions Facility 1",
  "c": 350.5,
  "h": 65.2,
  "t": 24.8,
  "cr": 2,
  "e": 200.3,
  "o": true,
  "status": "active",
  "uptime": 3600,
  "rssi": -45,
  "t": 1703123456789
}
```

## Monitoring

The simulator displays:
- Connection status
- Number of devices per company
- Sample data from each company
- Real-time statistics every 30 seconds

## Stopping the Simulator

Press `Ctrl+C` to gracefully stop the simulator. It will:
1. Stop all data transmission
2. Clear all intervals
3. Disconnect from MQTT broker
4. Exit cleanly

## Integration with UI

Once running, you can:
1. Open the Carbon Credit Marketplace UI
2. Navigate to the IoT Device Dashboard
3. See real-time data from all simulated devices
4. Monitor carbon credit generation
5. View company statistics and rankings

## Troubleshooting

### Connection Issues
- Ensure MQTT broker is running
- Check broker URL and credentials
- Verify network connectivity

### No Data in UI
- Check MQTT broker configuration
- Verify topic subscriptions
- Ensure InfluxDB is running and configured

### Performance Issues
- Reduce number of devices if needed
- Increase data transmission intervals
- Check system resources

## Customization

You can modify the simulator by editing `scripts/mqtt-data-simulator.js`:

- Add more companies
- Change device count per API key
- Modify data transmission intervals
- Adjust sensor data ranges
- Add custom alert types
