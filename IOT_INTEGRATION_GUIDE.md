# 🌿 IoT Carbon Credit Integration - Complete Setup Guide

This guide provides a comprehensive overview of the IoT device integration system for automatic carbon credit minting and burning based on real-time sensor data.

## 📋 System Overview

The IoT Carbon Credit Integration system consists of:

1. **Smart Contracts** - Carbon credit token management and IoT data verification
2. **Backend API** - NestJS-based API for device communication and data processing
3. **IoT Devices** - ESP32-based devices for real-time data collection
4. **Frontend Dashboard** - Real-time monitoring and device management
5. **Blockchain Integration** - Automatic token minting/burning when thresholds are reached

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Devices   │    │   Backend API   │    │  Smart Contracts│
│                 │    │                 │    │                 │
│ • ESP32 Creator │───▶│ • NestJS Server │───▶│ • Carbon Token  │
│ • ESP32 Burner  │    │ • Data Processing│    │ • IoT Verifier  │
│ • Sensors       │    │ • Threshold Logic│    │ • Auto Mint/Burn│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Database      │    │   Blockchain     │
│                 │    │                 │    │                 │
│ • Device Monitor│    │ • PostgreSQL    │    │ • Ethereum      │
│ • Real-time UI  │    │ • Device Data   │    │ • Arbitrum      │
│ • Dashboard     │    │ • Transactions  │    │ • Polygon       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Smart Contract Deployment

```bash
cd contracts
npm install

# Deploy to local network
npx hardhat ignition deploy ignition/modules/CarbonCreditToken.ts --network localhost

# Deploy to testnet
npx hardhat ignition deploy ignition/modules/CarbonCreditToken.ts --network sepolia
```

### 2. Backend API Setup

```bash
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start PostgreSQL database
docker run -d --name carbon-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:13

# Run database migrations
npm run migration:run

# Start the API server
npm run start:dev
```

### 3. IoT Device Configuration

```bash
# Install Arduino IDE and ESP32 board support
# Open the production Arduino files:
# - iot/creator/carbon-credit-creator-production.ino
# - iot/burner/carbon-credit-burner-production.ino

# Configure WiFi credentials and API endpoint
# Upload to ESP32 devices
```

### 4. Frontend Dashboard

```bash
cd frontend
npm install

# Start the development server
npm run dev
```

## 📊 Device Types

### Carbon Credit Creator Devices

- **Purpose**: Monitor CO2 reduction activities
- **Sensors**: CO2 reduction, renewable energy generation
- **Action**: Mint carbon credits when thresholds are reached
- **Examples**: Solar panels, wind turbines, carbon capture systems

### Carbon Credit Burner Devices

- **Purpose**: Monitor CO2 emission activities
- **Sensors**: CO2 emissions, energy consumption
- **Action**: Burn carbon credits to offset emissions
- **Examples**: Manufacturing plants, data centers, transportation

## 🔧 Configuration

### Device Thresholds

```typescript
// Default thresholds (configurable per device)
const CREATOR_THRESHOLDS = {
  co2Threshold: 1000, // CO2 reduction units
  energyThreshold: 500, // Energy generation units
  timeWindow: 3600, // 1 hour in seconds
};

const BURNER_THRESHOLDS = {
  co2Threshold: 1000, // CO2 emission units
  energyThreshold: 500, // Energy consumption units
  timeWindow: 3600, // 1 hour in seconds
};
```

### Credit Calculation

```typescript
// Credit calculation formulas
const CREDIT_RATES = {
  creator: {
    co2ToCredits: 1000, // 1000 CO2 reduction units = 1 credit
    energyToCredits: 500, // 500 energy units = 1 credit
  },
  burner: {
    co2ToCredits: 1000, // 1000 CO2 emission units = 1 credit burn
    energyToCredits: 500, // 500 energy units = 1 credit burn
  },
};
```

## 📡 API Endpoints

### Device Management

- `POST /iot/devices` - Register new device
- `GET /iot/devices` - Get all devices
- `GET /iot/devices/:deviceId` - Get device status
- `PUT /iot/devices/:deviceId/thresholds` - Update thresholds

### Data Collection

- `POST /iot/data` - Receive IoT sensor data
- `GET /iot/devices/:deviceId/data` - Get historical data

### Blockchain Integration

- `POST /blockchain/mint` - Process mint requests
- `POST /blockchain/burn` - Process burn requests
- `GET /blockchain/status/:txHash` - Check transaction status

## 🔒 Security Features

### Device Authentication

- Device ID validation
- API key authentication
- Data integrity verification

### Data Verification

- SHA-256 data hashing
- Timestamp validation
- Sensor reading validation

### Smart Contract Security

- Multi-signature requirements
- Time-locked operations
- Emergency pause functionality

## 📈 Monitoring & Analytics

### Real-time Metrics

- Device connection status
- Data transmission rates
- Threshold achievement rates
- Credit minting/burning volumes

### Historical Data

- Sensor data trends
- Credit transaction history
- Device performance metrics
- Environmental impact tracking

## 🛠️ Troubleshooting

### Common Issues

1. **Device Connection Problems**
   - Check WiFi credentials
   - Verify API endpoint URL
   - Check device registration status

2. **Data Transmission Errors**
   - Verify backend API is running
   - Check network connectivity
   - Validate data format

3. **Threshold Not Triggering**
   - Check threshold configuration
   - Verify sensor readings
   - Check time window settings

4. **Blockchain Transaction Failures**
   - Verify contract addresses
   - Check gas fees
   - Validate transaction parameters

### Debug Mode

Enable debug logging in Arduino code:

```cpp
#define DEBUG_MODE true

if (DEBUG_MODE) {
  Serial.println("Debug: " + debugMessage);
}
```

## 🔄 Maintenance

### Regular Tasks

- Monitor device health
- Update threshold configurations
- Process pending transactions
- Backup device data

### Updates

- Firmware updates for IoT devices
- Smart contract upgrades
- API version updates
- Frontend improvements

## 📚 Additional Resources

- [Arduino ESP32 Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Viem Documentation](https://viem.sh/)

## 🤝 Support

For technical support and questions:

- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

---

**Note**: This system is designed for production use with real IoT devices and blockchain networks. Ensure proper testing and security measures are in place before deployment.
