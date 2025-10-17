# How to View Time-Series Data

There are several ways to view and analyze your MQTT time-series data stored in InfluxDB:

## 1. 🌐 InfluxDB Web UI (Easiest)

### Access the Web Interface
1. Open your browser and go to: **http://localhost:8086**
2. Login with:
   - **Username**: admin
   - **Password**: carboncredit123

### Navigate to Data Explorer
1. Click on **"Data Explorer"** in the left sidebar
2. Select your bucket: **mqtt-data**
3. Choose measurement: **sensor_data**

### Sample Queries to Try

#### View All Recent Data
```flux
from(bucket: "mqtt-data")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> sort(columns: ["_time"], desc: true)
  |> limit(n: 100)
```

#### CO2 Levels Over Time
```flux
from(bucket: "mqtt-data")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> filter(fn: (r) => r._field == "co2")
  |> sort(columns: ["_time"])
```

#### Device Statistics
```flux
from(bucket: "mqtt-data")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> filter(fn: (r) => r.device_id == "YOUR_DEVICE_ID")
  |> group(columns: ["_field"])
  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
```

## 2. 🔌 API Endpoints (Programmatic Access)

### Query Raw Data
```bash
# Get all data from last 24 hours
curl "http://localhost:3000/api/timeseries/query?startTime=-24h&limit=100"

# Filter by device
curl "http://localhost:3000/api/timeseries/query?deviceId=DEVICE_001&startTime=-1h"

# Filter by device type
curl "http://localhost:3000/api/timeseries/query?deviceType=SEQUESTER&startTime=-6h"

# Filter by wallet address
curl "http://localhost:3000/api/timeseries/query?walletAddress=0x1234...5678&startTime=-12h"
```

### Get Device Statistics
```bash
# Device statistics for last 24 hours
curl "http://localhost:3000/api/timeseries/stats?deviceId=DEVICE_001&period=24h"

# All sequester devices stats
curl "http://localhost:3000/api/timeseries/stats?deviceType=SEQUESTER&period=7d"

# Specific wallet statistics
curl "http://localhost:3000/api/timeseries/stats?walletAddress=0x1234...5678&period=1h"
```

## 3. 🌐 Web Dashboard (Built-in)

### Access the Dashboard
1. Start your Next.js development server: `npm run dev`
2. Navigate to: **http://localhost:3000/timeseries**
3. Use the built-in filters and controls to explore your data

### Features
- **Raw Data View**: See individual sensor readings with timestamps
- **Statistics View**: View aggregated statistics (min, max, average)
- **Time Range Filtering**: Choose from 1 hour to 30 days
- **Device Filtering**: Filter by specific device IDs
- **Real-time Updates**: Data refreshes automatically

## 4. 💻 Command Line Tool

### Install and Use
```bash
# Make the script executable
chmod +x view-timeseries.js

# View raw data from last 24 hours
./view-timeseries.js --query

# View device statistics
./view-timeseries.js --stats

# Filter by specific device
./view-timeseries.js --query --device DEVICE_001

# Custom time range
./view-timeseries.js --stats --time 7d

# Limit results
./view-timeseries.js --query --limit 50
```

### Command Options
- `--query, -q`: View raw time-series data
- `--stats, -s`: View device statistics  
- `--device, -d <id>`: Filter by device ID
- `--time, -t <range>`: Time range (1h, 6h, 24h, 7d, 30d)
- `--limit, -l <number>`: Limit number of records
- `--help, -h`: Show help message

## 5. 🔧 Direct Database Access

### Using InfluxDB CLI
```bash
# Access InfluxDB CLI container
docker exec -it carbon-credit-influxdb-cli influx

# Switch to your bucket
use mqtt-data

# Run Flux queries
from(bucket: "mqtt-data")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> limit(n: 10)
```

### Using curl with InfluxDB API
```bash
# Query data using InfluxDB HTTP API
curl -X POST "http://localhost:8086/api/v2/query" \
  -H "Authorization: Token carbon-credit-token-123" \
  -H "Content-Type: application/vnd.flux" \
  -d 'from(bucket: "mqtt-data") |> range(start: -1h) |> limit(n: 10)'
```

## 6. 📊 Data Export Options

### Export to CSV
```bash
# Use the command-line tool to export data
./view-timeseries.js --query --time 7d > data-export.csv
```

### Export via API
```bash
# Get JSON data for processing
curl "http://localhost:3000/api/timeseries/query?startTime=-7d&limit=1000" > data.json
```

## 7. 🎯 Common Use Cases

### Monitor Device Health
```bash
# Check if devices are sending data
./view-timeseries.js --stats --time 1h

# Look for devices with no recent data
./view-timeseries.js --query --time 24h | grep "No data"
```

### Analyze Carbon Credits
```bash
# View credit generation over time
./view-timeseries.js --query --time 7d | grep "Credits"

# Compare sequester vs emitter devices
./view-timeseries.js --stats --time 24h
```

### Debug MQTT Issues
```bash
# Check recent connection events
curl "http://localhost:3000/api/timeseries/query?measurement=device_events&startTime=-1h"

# Verify data is being stored
./view-timeseries.js --query --time 1h --limit 10
```

## 8. 🔍 Troubleshooting

### No Data Showing
1. **Check Docker services**: `docker-compose -f docker-compose.timeseries.yml ps`
2. **Verify MQTT messages**: Check browser console for MQTT connection
3. **Check InfluxDB logs**: `docker-compose -f docker-compose.timeseries.yml logs influxdb`
4. **Test API endpoints**: `curl http://localhost:3000/api/timeseries/query`

### Slow Queries
1. **Reduce time range**: Use shorter periods (1h instead of 7d)
2. **Add filters**: Filter by device ID or type
3. **Limit results**: Use `--limit` parameter
4. **Check data volume**: Large datasets take longer to process

### Connection Issues
1. **Verify services**: Ensure InfluxDB and MQTT broker are running
2. **Check ports**: Verify ports 8086, 1883, 9001 are accessible
3. **Network issues**: Check Docker network configuration
4. **Authentication**: Verify InfluxDB token and credentials

## 9. 📈 Advanced Queries

### Custom Flux Queries in InfluxDB UI
```flux
// Average CO2 levels by device type
from(bucket: "mqtt-data")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> filter(fn: (r) => r._field == "co2")
  |> group(columns: ["device_type"])
  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)

// Device uptime analysis
from(bucket: "mqtt-data")
  |> range(start: -7d)
  |> filter(fn: (r) => r._measurement == "device_events")
  |> filter(fn: (r) => r._field == "event")
  |> group(columns: ["device_id"])
  |> count()

// Credit generation trends
from(bucket: "mqtt-data")
  |> range(start: -30d)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> filter(fn: (r) => r._field == "credits")
  |> filter(fn: (r) => r.device_type == "SEQUESTER")
  |> aggregateWindow(every: 1d, fn: sum, createEmpty: false)
```

## 10. 🚀 Next Steps

1. **Set up alerts**: Configure InfluxDB alerts for device disconnections
2. **Create dashboards**: Build custom dashboards in InfluxDB UI
3. **Data retention**: Set up retention policies for long-term storage
4. **Backup strategy**: Implement regular backups of time-series data
5. **Performance monitoring**: Monitor query performance and optimize as needed
6. **Integration**: Connect with external tools like Grafana for advanced visualization
