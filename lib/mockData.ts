import {
  User,
  UserStats,
} from './types';

// Helper function to create user objects
const createUser = (address: string, name: string, avatar: string): User => ({
  id: generateId(),
  walletAddress: address,
  username: name,
  role: 'USER',
  isVerified: true,
  createdAt: '2023-06-15T10:00:00Z',
  // Legacy fields for backward compatibility
  address,
  name,
  avatar,
  bio: `IoT device manager and environmental monitoring enthusiast`,
  joined: '2023-06-15T10:00:00Z',
  stats: {
    itemsOwned: Math.floor(Math.random() * 20) + 5,
    collections: Math.floor(Math.random() * 10) + 2,
    volumeTraded: Math.random() * 100,
    totalCredits: Math.floor(Math.random() * 5000) + 1000,
    creditsUsed: Math.floor(Math.random() * 2000) + 500,
  },
});

// Helper function to generate IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Mock user data
export const mockUser: User = createUser(
      '0x1234...5678',
  'EcoTrader',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
);

// Mock IoT device data
export const mockIoTDevices = [
  {
    id: 'device-001',
    name: 'Temperature Sensor Alpha',
    type: 'Temperature',
    status: 'active',
    location: 'Amazon Rainforest, Brazil',
    lastReading: new Date().toISOString(),
    readings: {
      temperature: 24.5,
      humidity: 78.2,
      co2: 420,
    },
  },
  {
    id: 'device-002',
    name: 'Air Quality Monitor Beta',
    type: 'Air Quality',
    status: 'active',
    location: 'Siberian Forest, Russia',
    lastReading: new Date().toISOString(),
    readings: {
      pm25: 15.3,
      pm10: 22.1,
      o3: 45.2,
    },
  },
  {
    id: 'device-003',
    name: 'Soil Moisture Sensor Gamma',
    type: 'Soil',
    status: 'maintenance',
    location: 'Congo Basin, Africa',
    lastReading: new Date(Date.now() - 86400000).toISOString(),
    readings: {
      moisture: 65.8,
      ph: 6.2,
      nutrients: 85.4,
    },
  },
];

// Mock carbon credit data
export const mockCarbonCredits = [
  {
    id: 'credit-001',
    projectName: 'Amazon Reforestation',
    credits: 1250,
    price: 15.50,
    currency: 'USD',
    status: 'active',
    verificationStandard: 'VCS',
    vintage: 2023,
    location: 'Brazil',
  },
  {
    id: 'credit-002',
    projectName: 'Siberian Forest Protection',
    credits: 890,
    price: 18.75,
    currency: 'USD',
    status: 'active',
    verificationStandard: 'VCS',
    vintage: 2023,
    location: 'Russia',
  },
  {
    id: 'credit-003',
    projectName: 'Congo Basin Conservation',
    credits: 2100,
    price: 12.30,
    currency: 'USD',
    status: 'retired',
    verificationStandard: 'VCS',
    vintage: 2022,
    location: 'Congo',
  },
];

// Mock environmental data
export const mockEnvironmentalData = [
  {
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    deviceId: 'device-001',
    temperature: 24.5,
    humidity: 78.2,
    co2: 420,
    creditsGenerated: 2.5,
  },
  {
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    deviceId: 'device-001',
    temperature: 23.8,
    humidity: 79.1,
    co2: 415,
    creditsGenerated: 2.3,
  },
  {
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    deviceId: 'device-001',
    temperature: 25.2,
    humidity: 77.5,
    co2: 425,
    creditsGenerated: 2.7,
  },
];