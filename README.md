# Carbon Credit Marketplace

A comprehensive carbon credit trading platform that combines blockchain technology, IoT sensors, and web applications to create a transparent and efficient carbon credit marketplace.

## 🌱 Project Overview

This project implements a complete carbon credit ecosystem featuring:
- **Smart Contracts**: Blockchain-based carbon credit tokenization and trading
- **IoT Integration**: Real-time environmental monitoring and data collection
- **Web Application**: User-friendly marketplace interface
- **Data Analytics**: Comprehensive tracking and reporting of carbon credits

## 📁 Project Structure

```
carbon-credit-marketplace/
├── contracts/                 # Smart Contracts (Hardhat)
│   ├── contracts/            # Solidity contracts
│   │   ├── CarbonCreditToken.sol
│   │   ├── IoTDataVerifier.sol
│   │   └── Counter.sol
│   ├── test/                # Contract tests
│   ├── scripts/             # Deployment scripts
│   ├── ignition/            # Hardhat Ignition modules
│   └── platformio.ini       # Hardhat configuration
│
├── frontend/                 # Next.js Web Application
│   ├── app/                 # App Router pages
│   │   ├── page.tsx         # Homepage
│   │   ├── nfts/            # NFT marketplace
│   │   ├── collections/     # Collection management
│   │   ├── profile/         # User profiles
│   │   └── swap/            # Trading interface
│   ├── components/          # React components
│   │   ├── ui/              # Base UI components
│   │   ├── layout/          # Layout components
│   │   ├── NFTCard.tsx      # NFT display
│   │   ├── BuyModal.tsx     # Purchase interface
│   │   └── SellModal.tsx    # Selling interface
│   ├── lib/                 # Utilities and configurations
│   │   ├── db/              # Database schema
│   │   ├── types.ts         # TypeScript definitions
│   │   └── utils.ts         # Helper functions
│   ├── pages/api/           # API routes
│   │   └── iot/             # IoT data endpoints
│   └── config/              # App configuration
│
├── iot/                     # IoT Projects (PlatformIO)
│   ├── CarbonCredit/        # Main monitoring device
│   │   ├── src/
│   │   │   ├── main.cpp     # Main application code
│   │   │   └── secrets.h    # WiFi & Firebase credentials
│   │   ├── platformio.ini   # PlatformIO configuration
│   │   └── wokwi.toml       # Wokwi simulator config
│   │
│   ├── creator/             # Carbon credit creator device
│   │   ├── src/
│   │   │   ├── main.cpp     # Creator application
│   │   │   └── secrets.h    # Configuration
│   │   ├── platformio.ini   # PlatformIO setup
│   │   └── wokwi.toml       # Simulator config
│   │
│   └── burner/              # Carbon credit burner device
│       ├── src/
│       │   ├── main.cpp     # Burner application
│       │   └── secrets.h    # Configuration
│       ├── platformio.ini   # PlatformIO setup
│       └── wokwi.toml       # Simulator config
│
├── init-scripts/            # Database initialization
│   └── 01-init-db.sh        # Database setup script
│
├── docker-compose.yml       # Container orchestration
├── SETUP_GUIDE.md          # Setup instructions
├── IOT_INTEGRATION_GUIDE.md # IoT integration guide
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- PlatformIO CLI
- Docker & Docker Compose
- Git

### 1. Clone Repository
```bash
git clone https://github.com/NirajBhattarai/Carbon-credit-Marketplace-.git
cd carbon-credit-marketplace
```

### 2. Smart Contracts Setup
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. IoT Development
```bash
# Install PlatformIO CLI
pip install platformio

# Build and upload to ESP32
cd iot/CarbonCredit
pio run --target upload
```

### 5. Database Setup
```bash
docker-compose up -d
./init-scripts/01-init-db.sh
```

## 🏗️ Architecture Components

### Smart Contracts (`contracts/`)
- **CarbonCreditToken.sol**: ERC-721 NFT implementation for carbon credits
- **IoTDataVerifier.sol**: Validates IoT sensor data for credit generation
- **Counter.sol**: Example contract for testing

**Key Features:**
- Carbon credit tokenization as NFTs
- IoT data verification and validation
- Transparent trading mechanisms
- Automated credit generation based on environmental data

### Web Application (`frontend/`)
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Drizzle ORM** for database management

**Key Features:**
- NFT marketplace interface
- User profile management
- Real-time trading
- IoT data visualization
- Collection management

### IoT Integration (`iot/`)
- **ESP32** microcontrollers
- **PlatformIO** development environment
- **Firebase** cloud integration
- **OLED displays** for local monitoring

**Device Types:**
1. **CarbonCredit**: Main monitoring device with Firebase integration
2. **Creator**: Generates carbon credits based on environmental data
3. **Burner**: Consumes credits to offset emissions

**Key Features:**
- Real-time environmental monitoring
- WiFi connectivity with Google DNS
- Firebase cloud data synchronization
- OLED display for local status
- Sensor data validation and processing

## 🔧 Development

### Smart Contract Development
```bash
cd contracts
npx hardhat compile          # Compile contracts
npx hardhat test            # Run tests
npx hardhat deploy          # Deploy to network
```

### Frontend Development
```bash
cd frontend
npm run dev                 # Start development server
npm run build              # Build for production
npm run lint               # Run ESLint
```

### IoT Development
```bash
cd iot/[project-name]
pio run                    # Build project
pio run --target upload    # Upload to device
pio device monitor         # Monitor serial output
```

## 🌐 API Endpoints

### IoT Data API (`frontend/pages/api/iot/`)
- `GET /api/iot/data` - Retrieve IoT sensor data
- `GET /api/iot/devices` - List all IoT devices
- `GET /api/iot/devices/[deviceId]` - Get specific device data

## 🔐 Configuration

### Environment Variables
Create `.env` files in respective directories:

**Frontend** (`frontend/.env.local`):
```env
DATABASE_URL=your_database_url
NEXT_PUBLIC_API_URL=your_api_url
```

**IoT** (`iot/[project]/src/secrets.h`):
```cpp
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"
#define DATABASE_URL "your_firebase_url"
```

## 📊 Data Flow

1. **IoT Sensors** collect environmental data (CO2, humidity, etc.)
2. **ESP32 Devices** process and validate sensor readings
3. **Firebase** stores real-time IoT data
4. **Smart Contracts** verify data and mint carbon credit NFTs
5. **Web Application** displays marketplace and trading interface
6. **Users** can buy, sell, and trade carbon credit NFTs

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
npx hardhat test
```

### Frontend
```bash
cd frontend
npm run test
```

### IoT Devices
Use Wokwi simulator or physical ESP32 devices for testing.

## 📈 Monitoring & Analytics

- **Real-time Dashboard**: Monitor IoT sensor data
- **Trading Analytics**: Track carbon credit transactions
- **Environmental Impact**: Measure carbon offset effectiveness
- **Device Status**: Monitor IoT device health and connectivity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Setup Guide](SETUP_GUIDE.md)
- [IoT Integration Guide](IOT_INTEGRATION_GUIDE.md)
- [Smart Contract Documentation](contracts/README.md)
- [Frontend Documentation](frontend/README.md)

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check the documentation in each component directory
- Review the setup guides for detailed instructions

---

**Built with ❤️ for a sustainable future** 🌍