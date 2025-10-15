# Carbon Credit Marketplace

A comprehensive platform for trading carbon credits with IoT integration for real-time environmental monitoring.

## Project Structure

```
carbon-credit-marketplace/
├── backend/          # NestJS API server
├── frontend/         # React/Next.js web application
├── iot/             # Arduino IoT simulation for CO2 monitoring
└── README.md        # This file
```

## Features

- **Carbon Credit Trading**: Buy and sell carbon credits
- **IoT Integration**: Real-time CO2 monitoring with Arduino simulation
- **Environmental Data**: Temperature, humidity, and CO2 level tracking
- **Alert System**: Automated notifications for environmental thresholds
- **Blockchain Integration**: Secure and transparent transactions
- **Analytics Dashboard**: Comprehensive data visualization

## Getting Started

### IoT Simulation (Wokwi)
1. Navigate to the `iot/` folder
2. Follow the setup instructions in `iot/README.md`
3. Use Wokwi Arduino Simulator for testing

### Backend Development
1. Navigate to the `backend/` folder
2. Install dependencies: `npm install`
3. Start development server: `npm run start:dev`

### Frontend Development
1. Navigate to the `frontend/` folder
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## Technology Stack

- **Backend**: NestJS, TypeScript, PostgreSQL
- **Frontend**: React/Next.js, TypeScript, Tailwind CSS
- **IoT**: Arduino, ESP32, Wokwi Simulator
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **API**: RESTful API with OpenAPI documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.