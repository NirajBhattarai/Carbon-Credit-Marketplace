# MQTT to InfluxDB Integration with Wallet Address Keys

## 🔑 Wallet Address as Primary Key

The Carbon Credit Marketplace automatically sends all MQTT IoT data to InfluxDB using **wallet addresses as primary keys**. This ensures that all carbon credit data is properly tracked and attributed to the correct users.

## 📊 How It Works

### 1. MQTT Message Flow
```
MQTT Topic → API Key Extraction → Wallet Address Lookup → InfluxDB Storage
```

### 2. Data Structure in InfluxDB

#### Sensor Data Measurement (`sensor_data`)
**Primary Key**: `wallet_address` (most important for carbon credit tracking)

**Tags**:
- `wallet_address`: User's wallet address (PRIMARY KEY)
- `device_id`: Device identifier
- `device_type`: SEQUESTER or EMITTER
- `api_key`: API key from MQTT topic
- `location`: Device location
- `ip`: Device IP address
- `mac`: Device MAC address

**Fields**:
- `co2`: CO2 reading (ppm)
- `humidity`: Humidity percentage
- `credits`: Carbon credits generated/consumed
- `emissions`: Emissions value
- `offset`: Offset status (boolean)

#### Device Events Measurement (`device_events`)
**Primary Key**: `wallet_address` (for tracking user device connections)

**Tags**:
- `wallet_address`: User's wallet address (PRIMARY KEY)
- `device_id`: Device identifier
- `device_type`: Device type
- `api_key`: API key
- `event`: Event type (connected, disconnected, error)

**Fields**:
- `error`: Error message (if applicable)

## 🔄 Automatic Data Flow

### When MQTT Message is Received:

1. **Topic Parsing**: Extract API key from MQTT topic
   ```
   Topic: carbon_sequester/cc_dfd123.../sensor_data
   API Key: cc_dfd123...
   ```

2. **Wallet Lookup**: Query database to get wallet address
   ```sql
   SELECT users.walletAddress 
   FROM applications 
   JOIN users ON applications.userId = users.id 
   WHERE applications.apiKey = 'cc_dfd123...'
   ```

3. **Data Enrichment**: Add wallet address to sensor data
   ```json
   {
     "device_id": "DEVICE_001",
     "wallet_address": "0x1234567890abcdef...",
     "co2": 450,
     "credits": 225.0,
     "timestamp": 1234567890
   }
   ```

4. **InfluxDB Storage**: Save with wallet address as primary key
   ```flux
   sensor_data,wallet_address=0x1234567890abcdef,device_id=DEVICE_001,device_type=SEQUESTER co2=450,credits=225.0
   ```

## 🎯 Benefits of Wallet Address Keys

### 1. **User-Centric Tracking**
- All carbon credit data is linked to specific wallet addresses
- Easy to query all data for a specific user
- Proper attribution for carbon credit generation

### 2. **Carbon Credit Accounting**
- Track total credits generated per wallet
- Monitor emission offsets per user
- Calculate user-specific carbon footprints

### 3. **Data Integrity**
- Wallet addresses are immutable identifiers
- No confusion between different users
- Reliable data attribution

## 📈 Querying Data by Wallet Address

### 1. API Queries
```bash
# Get all data for a specific wallet
curl "http://localhost:3000/api/timeseries/query?walletAddress=0x1234...5678&startTime=-24h"

# Get statistics for a wallet
curl "http://localhost:3000/api/timeseries/stats?walletAddress=0x1234...5678&period=7d"
```

### 2. InfluxDB Flux Queries
```flux
// All sensor data for a specific wallet
from(bucket: "mqtt-data")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> filter(fn: (r) => r.wallet_address == "0x1234567890abcdef")

// Credit generation by wallet
from(bucket: "mqtt-data")
  |> range(start: -7d)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> filter(fn: (r) => r._field == "credits")
  |> filter(fn: (r) => r.wallet_address == "0x1234567890abcdef")
  |> aggregateWindow(every: 1d, fn: sum, createEmpty: false)
```

### 3. Command Line Tool
```bash
# View data for specific wallet
./view-timeseries.js --query --wallet 0x1234...5678

# Get statistics for wallet
./view-timeseries.js --stats --wallet 0x1234...5678
```

## 🔍 Monitoring and Verification

### 1. Check Data Flow
```bash
# Test MQTT to InfluxDB integration
./test-mqtt-influxdb.js
```

### 2. Verify Wallet Address Keys
```bash
# Check if wallet addresses are being used as keys
curl "http://localhost:3000/api/timeseries/query?startTime=-1h" | jq '.data[].walletAddress'
```

### 3. Monitor Logs
```bash
# Check MQTT context logs
docker-compose -f docker-compose.timeseries.yml logs mosquitto

# Check InfluxDB logs
docker-compose -f docker-compose.timeseries.yml logs influxdb
```

## 🚨 Troubleshooting

### No Wallet Addresses in Data
1. **Check API Key Lookup**: Verify `/api/mqtt/wallet-address` endpoint
2. **Check Database**: Ensure `applications` and `users` tables have data
3. **Check MQTT Topics**: Verify topics contain valid API keys

### Data Not Appearing in InfluxDB
1. **Check InfluxDB Connection**: Verify InfluxDB is running
2. **Check MQTT Connection**: Ensure MQTT broker is accessible
3. **Check Logs**: Look for error messages in console

### Slow Data Processing
1. **Check Database Performance**: Monitor PostgreSQL queries
2. **Check InfluxDB Performance**: Monitor write operations
3. **Check Network**: Verify MQTT broker connectivity

## 📊 Data Examples

### Sample Sensor Data Point
```json
{
  "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
  "device_id": "DEVICE_001",
  "device_type": "SEQUESTER",
  "api_key": "cc_dfd123...",
  "co2": 450,
  "humidity": 65,
  "credits": 225.0,
  "emissions": 13.0,
  "offset": true,
  "timestamp": 1703123456789,
  "location": "San Francisco, CA",
  "ip": "192.168.1.100",
  "mac": "AA:BB:CC:DD:EE:FF"
}
```

### Sample Connection Event
```json
{
  "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
  "device_id": "DEVICE_001",
  "device_type": "SEQUESTER",
  "api_key": "cc_dfd123...",
  "event": "connected",
  "timestamp": 1703123456789,
  "error": ""
}
```

## 🎯 Key Features

✅ **Automatic Wallet Address Extraction**: From MQTT topics via API keys
✅ **Database Integration**: Real-time wallet address lookup
✅ **Primary Key Usage**: Wallet address as main identifier in InfluxDB
✅ **Error Handling**: Graceful fallbacks when wallet lookup fails
✅ **Comprehensive Logging**: Detailed logs for debugging
✅ **Real-time Processing**: Data sent to InfluxDB as MQTT messages arrive
✅ **Query Optimization**: Efficient queries by wallet address
✅ **Data Integrity**: Consistent data structure across all measurements

## 🚀 Next Steps

1. **Monitor Data Flow**: Use the test script to verify integration
2. **Set Up Alerts**: Configure alerts for wallet-specific data
3. **Create Dashboards**: Build wallet-centric visualizations
4. **Optimize Queries**: Use wallet address filters for better performance
5. **Data Retention**: Set up retention policies per wallet
6. **Backup Strategy**: Implement wallet-specific data backups
