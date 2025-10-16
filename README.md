# Carbon Credit Marketplace

A comprehensive carbon credit trading platform that combines blockchain technology, IoT sensors, and web applications to create a transparent and efficient carbon credit marketplace.

## 🌱 Project Overview

This project implements a complete carbon credit ecosystem featuring:
- **Smart Contracts**: Blockchain-based carbon credit tokenization and trading
- **Web Application**: User-friendly marketplace interface
- **Data Analytics**: Comprehensive tracking and reporting of carbon credits
- **IoT Integration**: Real-time environmental monitoring and data collection (separate repository)

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
│   └── hardhat.config.ts    # Hardhat configuration
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
├── init-scripts/            # Database initialization
│   └── 01-init-db.sh        # Database setup script
│
├── docker-compose.yml       # Container orchestration
├── SETUP_GUIDE.md          # Setup instructions
├── IOT_INTEGRATION_GUIDE.md # IoT integration guide
└── README.md               # This file
```

## 🔗 Related Projects

### IoT Simulator Repository
The IoT components for environmental monitoring and carbon credit simulation have been moved to a separate repository for better organization and independent development:

**🔗 [Carbon Credit IoT Simulator v1](https://github.com/NirajBhattarai/carboncreditsimulatoriotv1)**

This repository contains:
- **ESP32 IoT Devices**: CarbonCredit, Creator, and Burner devices
- **PlatformIO Projects**: Complete ESP32 development environment
- **MQTT Integration**: Real-time data transmission with Docker setup
- **Firebase Integration**: Cloud data synchronization
- **Sensor Simulation**: Environmental monitoring and carbon credit generation
- **Comprehensive Documentation**: Setup guides and troubleshooting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
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

### 3. Database Setup
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
- IoT data visualization (via API)
- Collection management

### IoT Integration
IoT components are now managed in a separate repository for better organization and independent development. See the [IoT Simulator Repository](https://github.com/NirajBhattarai/carboncreditsimulatoriotv1) for complete ESP32 projects with PlatformIO, MQTT, and Firebase integration.

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

**IoT Configuration**: See the [IoT Simulator Repository](https://github.com/NirajBhattarai/carboncreditsimulatoriotv1) for ESP32 and MQTT configuration details.

## 📊 Data Flow

1. **IoT Sensors** collect environmental data (CO2, humidity, etc.) - *See [IoT Simulator Repository](https://github.com/NirajBhattarai/carboncreditsimulatoriotv1)*
2. **ESP32 Devices** process and validate sensor readings - *See [IoT Simulator Repository](https://github.com/NirajBhattarai/carboncreditsimulatoriotv1)*
3. **MQTT/Firebase** stores real-time IoT data - *See [IoT Simulator Repository](https://github.com/NirajBhattarai/carboncreditsimulatoriotv1)*
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
IoT device testing is covered in the [IoT Simulator Repository](https://github.com/NirajBhattarai/carboncreditsimulatoriotv1). Use Wokwi simulator or physical ESP32 devices for testing.

## 📈 Monitoring & Analytics

- **Real-time Dashboard**: Monitor IoT sensor data (via API integration)
- **Trading Analytics**: Track carbon credit transactions
- **Environmental Impact**: Measure carbon offset effectiveness
- **Device Status**: Monitor IoT device health and connectivity (see [IoT Simulator Repository](https://github.com/NirajBhattarai/carboncreditsimulatoriotv1))

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
- [IoT Simulator Repository](https://github.com/NirajBhattarai/carboncreditsimulatoriotv1) - ESP32 projects with PlatformIO, MQTT, and Firebase
- [Smart Contract Documentation](contracts/README.md)
- [Frontend Documentation](frontend/README.md)

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check the documentation in each component directory
- Review the setup guides for detailed instructions

---

**Built with ❤️ for a sustainable future** 🌍