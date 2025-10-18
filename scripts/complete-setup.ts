#!/usr/bin/env tsx

/**
 * Complete Setup Script: Companies, API Keys, Devices & MQTT Simulation
 * 
 * This script will:
 * 1. Create 10 companies with API keys
 * 2. Register 10 IoT devices
 * 3. Start MQTT data simulation
 * 4. Show real-time data on UI
 * 
 * Usage: tsx scripts/complete-setup.ts
 */

import crypto from 'crypto';
import mqtt from 'mqtt';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { usertable, company, iotKeys, companyCredit, deviceCreditHistory } from '../lib/db/schema';

// Configuration
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/carbon_credit_iot?schema=public';
const cleanConnectionString = connectionString.replace(/\?schema=.*$/, '');
const client = postgres(cleanConnectionString, { prepare: false });
const db = drizzle(client);

// Sample companies data
const COMPANIES = [
  {
    companyName: 'EcoTech Solutions',
    address: '123 Green Street, San Francisco, CA',
    website: 'https://ecotech-solutions.com',
    location: 'San Francisco, CA',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678'
  },
  {
    companyName: 'CarbonFree Industries',
    address: '456 Eco Avenue, New York, NY',
    website: 'https://carbonfree-industries.com',
    location: 'New York, NY',
    walletAddress: '0x2345678901bcdef012345678901bcdef012345678'
  },
  {
    companyName: 'GreenEnergy Corp',
    address: '789 Renewable Road, Austin, TX',
    website: 'https://greenenergy-corp.com',
    location: 'Austin, TX',
    walletAddress: '0x3456789012cdef0123456789012cdef012345678'
  },
  {
    companyName: 'Sustainable Systems',
    address: '321 Clean Drive, Seattle, WA',
    website: 'https://sustainable-systems.com',
    location: 'Seattle, WA',
    walletAddress: '0x4567890123def01234567890123def012345678'
  },
  {
    companyName: 'EcoMonitor Inc',
    address: '654 Green Lane, Portland, OR',
    website: 'https://ecomonitor-inc.com',
    location: 'Portland, OR',
    walletAddress: '0x5678901234ef012345678901234ef012345678'
  },
  {
    companyName: 'ClimateTech Ltd',
    address: '987 Carbon Street, Denver, CO',
    website: 'https://climatetech-ltd.com',
    location: 'Denver, CO',
    walletAddress: '0x6789012345f0123456789012345f012345678'
  },
  {
    companyName: 'GreenData Systems',
    address: '147 Environment Ave, Boston, MA',
    website: 'https://greendata-systems.com',
    location: 'Boston, MA',
    walletAddress: '0x789012345601234567890123456012345678'
  },
  {
    companyName: 'EcoAnalytics Co',
    address: '258 Sustainable Blvd, Miami, FL',
    website: 'https://ecoanalytics-co.com',
    location: 'Miami, FL',
    walletAddress: '0x89012345671234567890123456712345678'
  },
  {
    companyName: 'CarbonTrack LLC',
    address: '369 Green Valley, Phoenix, AZ',
    website: 'https://carbontrack-llc.com',
    location: 'Phoenix, AZ',
    walletAddress: '0x9012345678234567890123456782345678'
  },
  {
    companyName: 'EcoMetrics Inc',
    address: '741 Clean Mountain, Salt Lake City, UT',
    website: 'https://ecometrics-inc.com',
    location: 'Salt Lake City, UT',
    walletAddress: '0x012345678934567890123456789345678'
  }
];

// Sample devices data
const DEVICES = [
  { deviceId: 'ECO001', deviceType: 'SEQUESTER', location: 'Factory Floor A' },
  { deviceId: 'ECO002', deviceType: 'SEQUESTER', location: 'Factory Floor B' },
  { deviceId: 'ECO003', deviceType: 'SEQUESTER', location: 'Warehouse Section 1' },
  { deviceId: 'ECO004', deviceType: 'SEQUESTER', location: 'Warehouse Section 2' },
  { deviceId: 'ECO005', deviceType: 'SEQUESTER', location: 'Office Building A' },
  { deviceId: 'ECO006', deviceType: 'SEQUESTER', location: 'Office Building B' },
  { deviceId: 'ECO007', deviceType: 'SEQUESTER', location: 'Research Lab 1' },
  { deviceId: 'ECO008', deviceType: 'SEQUESTER', location: 'Research Lab 2' },
  { deviceId: 'ECO009', deviceType: 'SEQUESTER', location: 'Production Line 1' },
  { deviceId: 'ECO010', deviceType: 'SEQUESTER', location: 'Production Line 2' }
];

interface Company {
  companyId: number;
  companyName: string;
  address: string | null;
  website: string | null;
  location: string | null;
  walletAddress: string | null;
}

interface ApiKey {
  keyId: number;
  companyId: number;
  keyValue: string;
}

interface Device {
  deviceId: string;
  deviceType: string;
  location: string;
}

interface IoTData {
  deviceId: string;
  apiKey: string;
  ip: string;      // IP address
  mac: string;     // MAC address
  avg_c: number;   // Average CO2 reading
  max_c: number;   // Maximum CO2 reading
  min_c: number;   // Minimum CO2 reading
  avg_h: number;   // Average humidity reading
  max_h: number;   // Maximum humidity reading
  min_h: number;   // Minimum humidity reading
  cr: number;      // Carbon credits
  e: number;       // Emissions
  o: boolean;      // Offset status
  t: number;       // Timestamp
  type: string;    // Device type (sequester/emitter)
  samples: number;  // Number of samples
}

class CompleteSetup {
  private companies: Company[] = [];
  private apiKeys: ApiKey[] = [];
  private devices: Device[] = [];
  private mqttClient: mqtt.MqttClient | null = null;
  private simulationInterval: NodeJS.Timeout | null = null;

  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async createOrGetUser(walletAddress: string): Promise<string> {
    console.log(`👤 Creating/getting user for wallet: ${walletAddress.slice(0, 10)}...`);
    
    try {
      // Check if user exists
      const existingUser = await db.select().from(usertable).where(eq(usertable.walletAddress, walletAddress)).limit(1);
      
      if (existingUser.length > 0) {
        console.log(`✅ User exists: ${existingUser[0].walletAddress}`);
        return existingUser[0].walletAddress;
      }
      
      // Create new user
      const newUser = await db.insert(usertable).values({
        walletAddress
      }).returning();
      
      console.log(`✅ Created new user: ${newUser[0].walletAddress}`);
      return newUser[0].walletAddress;
    } catch (error) {
      console.error('❌ Error creating/getting user:', error);
      throw error;
    }
  }


  async createCompany(companyData: typeof COMPANIES[0]): Promise<Company | null> {
    console.log(`🏢 Checking company: ${companyData.companyName}`);
    
    try {
      // Check if company already exists
      const existingCompany = await db.select().from(company).where(eq(company.walletAddress, companyData.walletAddress)).limit(1);
      
      if (existingCompany.length > 0) {
        console.log(`✅ Company already exists: ${existingCompany[0].companyName} (ID: ${existingCompany[0].companyId})`);
        return existingCompany[0];
      }
      
      // Create new company
      const newCompany = await db.insert(company).values({
        companyName: companyData.companyName,
        address: companyData.address,
        website: companyData.website,
        location: companyData.location,
        walletAddress: companyData.walletAddress
      }).returning();
      
      console.log(`✅ Created company: ${newCompany[0].companyName} (ID: ${newCompany[0].companyId})`);
      return newCompany[0];
    } catch (error) {
      console.error('❌ Error creating company:', error);
      throw error;
    }
  }

  async createApiKey(companyId: number): Promise<ApiKey> {
    console.log(`🔑 Checking API key for company ${companyId}`);
    
    try {
      // Check if API key already exists for this company
      const existingApiKey = await db.select().from(iotKeys).where(eq(iotKeys.companyId, companyId)).limit(1);
      
      if (existingApiKey.length > 0) {
        console.log(`✅ API key already exists for company ${companyId}: ${existingApiKey[0].keyValue.slice(0, 20)}...`);
        return existingApiKey[0];
      }
      
      // Create new API key
      const apiKeyValue = `cc_${crypto.randomBytes(32).toString('hex')}`;
      
      const newApiKey = await db.insert(iotKeys).values({
        companyId: companyId,
        keyValue: apiKeyValue
      }).returning();
      
      console.log(`✅ Created API key: ${apiKeyValue.slice(0, 20)}...`);
      return newApiKey[0];
    } catch (error) {
      console.error('❌ Error creating API key:', error);
      throw error;
    }
  }

  async registerDevice(deviceData: typeof DEVICES[0], apiKey: string): Promise<Device> {
    console.log(`📱 Registering device: ${deviceData.deviceId}`);
    
    // For now, just return the device data since we don't have a devices table
    // In a real implementation, you would insert into a devices table
    console.log(`✅ Device ${deviceData.deviceId} ready for simulation`);
    return deviceData;
  }

  async setupMQTT(): Promise<void> {
    console.log('🔌 Connecting to MQTT broker...');
    
    const options: mqtt.IClientOptions = {
      clientId: `carbon-credit-setup-${Date.now()}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    };

    if (MQTT_USERNAME && MQTT_PASSWORD) {
      options.username = MQTT_USERNAME;
      options.password = MQTT_PASSWORD;
    }

    this.mqttClient = mqtt.connect(MQTT_BROKER_URL, options);

    return new Promise((resolve, reject) => {
      this.mqttClient!.on('connect', () => {
        console.log('✅ Connected to MQTT broker');
        resolve();
      });

      this.mqttClient!.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
        reject(error);
      });
    });
  }

  generateIoTData(deviceId: string): IoTData {
    // Generate realistic IoT data matching the IoT simulator format
    const baseCredits = Math.random() * 50 + 25; // 25-75 credits
    const emissions = Math.random() * 30 + 10; // 10-40 emissions
    
    // Generate CO2 readings (300-2000 ppm range like IoT simulator)
    const avgCo2 = Math.random() * 1700 + 300; // 300-2000 ppm
    const maxCo2 = avgCo2 + Math.random() * 200; // Max is avg + 0-200
    const minCo2 = Math.max(300, avgCo2 - Math.random() * 200); // Min is avg - 0-200, but not below 300
    
    // Generate humidity readings (20-80% range like IoT simulator)
    const avgHumidity = Math.random() * 60 + 20; // 20-80%
    const maxHumidity = Math.min(80, avgHumidity + Math.random() * 20); // Max is avg + 0-20, capped at 80
    const minHumidity = Math.max(20, avgHumidity - Math.random() * 20); // Min is avg - 0-20, but not below 20
    
    const isOnline = Math.random() > 0.1; // 90% chance of being online
    const timestamp = Date.now(); // Use milliseconds like IoT simulator
    const samples = Math.floor(Math.random() * 10) + 5; // 5-15 samples

    // Generate random IP and MAC address
    const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const mac = Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');

    return {
      deviceId,
      apiKey: '', // Will be set when publishing
      ip,
      mac,
      avg_c: Math.round(avgCo2 * 10) / 10, // Average CO2
      max_c: Math.round(maxCo2), // Maximum CO2
      min_c: Math.round(minCo2), // Minimum CO2
      avg_h: Math.round(avgHumidity * 10) / 10, // Average humidity
      max_h: Math.round(maxHumidity), // Maximum humidity
      min_h: Math.round(minHumidity), // Minimum humidity
      cr: Math.round(baseCredits * 100) / 100, // Carbon credits
      e: Math.round(emissions * 100) / 100, // Emissions
      o: isOnline, // Offset status
      t: timestamp, // Timestamp
      type: 'sequester', // Device type
      samples // Number of samples
    };
  }

  async publishIoTData(deviceId: string, apiKey: string): Promise<void> {
    const data = this.generateIoTData(deviceId);
    
    // Create payload matching IoT simulator format (without deviceId and apiKey in JSON)
    const payload = {
      ip: data.ip,
      mac: data.mac,
      avg_c: data.avg_c,
      max_c: data.max_c,
      min_c: data.min_c,
      avg_h: data.avg_h,
      max_h: data.max_h,
      min_h: data.min_h,
      cr: data.cr,
      e: data.e,
      o: data.o,
      t: data.t,
      type: data.type,
      samples: data.samples
    };

    // Use the same topic format as IoT simulator: carbon_sequester/{apiKey}/sensor_data
    const topic = `carbon_sequester/${apiKey}/sensor_data`;
    
    console.log(`📡 Publishing data for ${deviceId}:`, {
      topic,
      credits: data.cr,
      avgCo2: data.avg_c,
      avgHumidity: data.avg_h,
      online: data.o,
      samples: data.samples
    });

    return new Promise((resolve, reject) => {
      this.mqttClient!.publish(topic, JSON.stringify(payload), (error) => {
        if (error) {
          console.error(`❌ Failed to publish data for ${deviceId}:`, error);
          reject(error);
        } else {
          console.log(`✅ Published data for ${deviceId} to topic: ${topic}`);
          resolve();
        }
      });
    });
  }

  startDataSimulation(): void {
    console.log('🚀 Starting IoT data simulation...');
    
    this.simulationInterval = setInterval(() => {
      // Publish data for all devices
      this.devices.forEach((device, index) => {
        const apiKey = this.apiKeys[index % this.apiKeys.length];
        this.publishIoTData(device.deviceId, apiKey.keyValue).catch(console.error);
      });
    }, 5000); // Publish every 5 seconds

    console.log('📊 Data simulation started! Check your UI at:');
    console.log(`   🌐 Company Dashboard: http://localhost:3000/my-company`);
    console.log(`   📱 IoT Data: http://localhost:3000/iot-data`);
    console.log(`   🔧 IoT Devices: http://localhost:3000/iot-devices`);
    console.log('\n⏹️  Press Ctrl+C to stop simulation');
  }

  stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    
    if (this.mqttClient) {
      this.mqttClient.end();
      this.mqttClient = null;
    }
    
    console.log('⏹️ Simulation stopped');
  }

  async run(): Promise<void> {
    try {
      console.log('🌟 Carbon Credit Data Simulator');
      console.log('================================');
      console.log(`🔌 MQTT Broker: ${MQTT_BROKER_URL}`);
      console.log(`🗄️ Database: ${connectionString.split('@')[1] || 'localhost'}`);
      console.log('');

      // Step 1: Setup MQTT connection
      await this.setupMQTT();

      // Step 2: Create new companies (always create new ones)
      console.log('\n📋 Creating New Companies & API Keys');
      console.log('=====================================');
      
      // Create new companies
      for (let i = 0; i < COMPANIES.length; i++) {
        const companyData = COMPANIES[i];
        
        // Create or get user
        await this.createOrGetUser(companyData.walletAddress);
        
        // Create company
        const company = await this.createCompany(companyData);
        if (company) {
          this.companies.push(company);
          
          // Create API key
          const apiKey = await this.createApiKey(company.companyId);
          this.apiKeys.push(apiKey);
        }
        
        console.log(`✅ Company ${i + 1}/10: ${company?.companyName || 'Skipped'} (ID: ${company?.companyId || 'N/A'})`);
        
        // Small delay between requests
        await this.delay(1000);
      }

      // Step 3: Register devices
      console.log('\n📋 Registering IoT Devices');
      console.log('==========================');
      
      for (let i = 0; i < DEVICES.length; i++) {
        const deviceData = DEVICES[i];
        const apiKey = this.apiKeys[i % this.apiKeys.length]; // Distribute devices across companies
        
        try {
          const device = await this.registerDevice(deviceData, apiKey.keyValue);
          this.devices.push(device);
          
          const companyName = this.companies[i % this.companies.length]?.companyName || 'Unknown';
          console.log(`✅ Device ${i + 1}/10: ${deviceData.deviceId} → ${companyName}`);
        } catch (error) {
          console.log(`⚠️ Device ${deviceData.deviceId} registration failed, continuing...`);
          // Add device anyway for simulation purposes
          this.devices.push(deviceData);
        }
        
        // Small delay between requests
        await this.delay(500);
      }

      // Step 4: Start IoT data simulation
      console.log('\n📋 Starting Data Simulation');
      console.log('============================');
      console.log(`🏢 Companies: ${this.companies.length}`);
      console.log(`🔑 API keys: ${this.apiKeys.length}`);
      console.log(`📱 Devices: ${this.devices.length}`);
      console.log('');
      
      this.startDataSimulation();

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n\n🛑 Received shutdown signal...');
        this.stopSimulation();
        client.end();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Simulation failed:', error);
      this.stopSimulation();
      client.end();
      process.exit(1);
    }
  }
}

// Run the setup
if (require.main === module) {
  const setup = new CompleteSetup();
  setup.run().catch(console.error);
}

export default CompleteSetup;
