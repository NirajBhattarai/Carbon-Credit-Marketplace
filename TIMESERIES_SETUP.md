# Time-Series Database Setup for Carbon Credit Marketplace

This guide will help you set up InfluxDB as a time-series database to store MQTT sensor data from your carbon credit devices.

## 🚀 Quick Start

### 1. Run the Setup Script
```bash
./setup-timeseries.sh
```

This script will:
- Create necessary directories
- Start Docker services (InfluxDB + MQTT broker)
- Verify all services are running
- Display access information

### 2. Manual Setup (Alternative)

#### Start Docker Services
```bash
docker-compose -f docker-compose.timeseries.yml up -d
```

#### Verify Services
```bash
# Check InfluxDB
curl http://localhost:8086/health

# Check MQTT broker
nc -z localhost 1883
nc -z localhost 9001
```

## 📊 InfluxDB Configuration

### Access Information
- **URL**: http://localhost:8086
- **Username**: admin
- **Password**: carboncredit123
- **Organization**: carbon-credit-org
- **Bucket**: mqtt-data
- **Token**: carbon-credit-token-123

### Data Schema

#### Sensor Data Measurement (`sensor_data`)
**Tags:**
- `device_id`: Unique device identifier
- `device_type`: SEQUESTER or EMITTER
- `api_key`: API key from MQTT topic
- `wallet_address`: User's wallet address
- `location`: Device location
- `ip`: Device IP address
- `mac`: Device MAC address

**Fields:**
- `co2`: CO2 reading (ppm)
- `humidity`: Humidity percentage
- `credits`: Carbon credits generated/consumed
- `emissions`: Emissions value
- `offset`: Offset status (boolean)

#### Device Events Measurement (`device_events`)
**Tags:**
- `device_id`: Device identifier
- `device_type`: Device type
- `api_key`: API key
- `wallet_address`: Wallet address
- `event`: Event type (connected, disconnected, error)

**Fields:**
- `error`: Error message (if applicable)

## 📡 MQTT Configuration

### Broker Endpoints
- **TCP**: localhost:1883
- **WebSocket**: ws://localhost:9001

### Topic Structure
```
carbon_sequester/{apiKey}/sensor_data
carbon_emitter/{apiKey}/sensor_data
```

### Message Format
```json
{
  "c": 450,      // CO2 reading
  "h": 65,       // Humidity
  "cr": 225.0,   // Credits
  "e": 13.0,     // Emissions
  "o": true,     // Offset status
  "t": 1234567890 // Timestamp
}
```

## 🔌 API Endpoints

### Query Time-Series Data
```http
GET /api/timeseries/query?deviceId=DEVICE_001&startTime=-24h&limit=100
```

**Query Parameters:**
- `deviceId`: Filter by device ID
- `deviceType`: Filter by device type (SEQUESTER/EMITTER)
- `walletAddress`: Filter by wallet address
- `startTime`: Start time (default: -24h)
- `endTime`: End time (default: now)
- `limit`: Maximum records (default: 100)
- `measurement`: Measurement name (default: sensor_data)

### Device Statistics
```http
GET /api/timeseries/stats?deviceId=DEVICE_001&period=24h
```

**Query Parameters:**
- `deviceId`: Filter by device ID
- `deviceType`: Filter by device type
- `walletAddress`: Filter by wallet address
- `period`: Time period (default: 24h)

## 🛠️ Development

### Environment Variables
Add these to your `.env.local` file:
```env
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=carbon-credit-token-123
INFLUXDB_ORG=carbon-credit-org
INFLUXDB_BUCKET=mqtt-data
NEXT_PUBLIC_MQTT_BROKER=ws://localhost:9001
```

### Code Integration

#### MQTT Context Integration
The MQTT context automatically saves all incoming sensor data to InfluxDB:

```typescript
// Data is automatically saved when MQTT messages are received
const { sequesterDevices, emitterDevices } = useMQTT()
```

#### Manual Data Writing
```typescript
import { writeSensorData, writeConnectionEvent } from '@/lib/influxdb'

// Write sensor data
await writeSensorData({
  deviceId: 'DEVICE_001',
  deviceType: 'SEQUESTER',
  co2: 450,
  humidity: 65,
  credits: 225.0,
  emissions: 13.0,
  offset: true,
  timestamp: Date.now()
})

// Write connection event
await writeConnectionEvent({
  deviceId: 'DEVICE_001',
  deviceType: 'SEQUESTER',
  event: 'connected',
  timestamp: Date.now()
})
```

## 📈 Data Visualization

### InfluxDB UI
Access the InfluxDB UI at http://localhost:8086 to:
- View real-time data
- Create dashboards
- Set up alerts
- Query data with Flux

### Example Flux Queries

#### Get latest sensor data
```flux
from(bucket: "mqtt-data")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> filter(fn: (r) => r._field == "co2")
  |> sort(columns: ["_time"], desc: true)
  |> limit(n: 100)
```

#### Device statistics
```flux
from(bucket: "mqtt-data")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> filter(fn: (r) => r.device_id == "DEVICE_001")
  |> group(columns: ["_field"])
  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
```

## 🔧 Troubleshooting

### Common Issues

#### InfluxDB not starting
```bash
docker-compose -f docker-compose.timeseries.yml logs influxdb
```

#### MQTT broker issues
```bash
docker-compose -f docker-compose.timeseries.yml logs mosquitto
```

#### Data not being saved
- Check InfluxDB connection in browser console
- Verify MQTT messages are being received
- Check API logs for errors

### Useful Commands

```bash
# View all logs
docker-compose -f docker-compose.timeseries.yml logs -f

# Restart services
docker-compose -f docker-compose.timeseries.yml restart

# Stop services
docker-compose -f docker-compose.timeseries.yml down

# Remove all data (careful!)
docker-compose -f docker-compose.timeseries.yml down -v
```

## 📚 Additional Resources

- [InfluxDB Documentation](https://docs.influxdata.com/influxdb/v2.7/)
- [Flux Query Language](https://docs.influxdata.com/flux/v0.x/)
- [MQTT Protocol](https://mqtt.org/mqtt-specification/)
- [Docker Compose](https://docs.docker.com/compose/)

## 🎯 Next Steps

1. **Set up monitoring**: Create alerts for device disconnections
2. **Build dashboards**: Use InfluxDB UI or Grafana for visualization
3. **Data retention**: Configure retention policies for long-term storage
4. **Backup strategy**: Set up regular backups of time-series data
5. **Performance tuning**: Optimize queries and data structure as needed
