#!/usr/bin/env node

/**
 * MQTT Data Simulator for New Schema
 * 
 * This script simulates IoT devices sending data via MQTT and receiving credit updates
 * Compatible with the new company-based database schema
 */

const mqtt = require('mqtt');
const crypto = require('crypto');

// Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'ws://localhost:9001';
const NUM_COMPANIES = 5;
const API_KEYS_PER_COMPANY = 10;
const DEVICES_PER_API_KEY = 5;
const SEND_INTERVAL_MS = 2000; // Send data every 2 seconds
const CREDIT_UPDATE_INTERVAL_MS = 30000; // Update credits every 30 seconds

// Company data matching the database
const COMPANIES = [
  {
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    companyName: 'EcoTech Solutions',
    location: 'San Francisco, CA',
    apiKeys: [],
    devices: []
  },
  {
    walletAddress: '0x2345678901bcdef1234567890abcdef1234567890',
    companyName: 'GreenForest Corp',
    location: 'Portland, OR',
    apiKeys: [],
    devices: []
  },
  {
    walletAddress: '0x3456789012cdef1234567890abcdef12345678901',
    companyName: 'OceanClean Industries',
    location: 'Miami, FL',
    apiKeys: [],
    devices: []
  },
  {
    walletAddress: '0x4567890123def1234567890abcdef123456789012',
    companyName: 'UrbanGreen Systems',
    location: 'New York, NY',
    apiKeys: [],
    devices: []
  },
  {
    walletAddress: '0x5678901234ef1234567890abcdef1234567890123',
    companyName: 'AgriCarbon Ltd',
    location: 'Austin, TX',
    apiKeys: [],
    devices: []
  }
];

const clients = [];
const deviceData = new Map(); // Stores current state for each device

// Generate API key (same format as database)
function generateApiKey() {
  const prefix = 'cc_' + crypto.randomBytes(16).toString('hex');
  return prefix;
}

// Generate device ID
function generateDeviceId(companyIndex, apiKeyIndex, deviceIndex) {
  return `DEV_${String(companyIndex + 1).padStart(2, '0')}_${String(apiKeyIndex + 1).padStart(2, '0')}_${String(deviceIndex + 1).padStart(2, '0')}`;
}

// Generate random sensor data
function generateRandomData() {
  return {
    co2: parseFloat((Math.random() * (1000 - 100) + 100).toFixed(2)), // CO2 sequestered (100-1000 ppm)
    humidity: parseFloat((Math.random() * (90 - 30) + 30).toFixed(2)), // Humidity (30-90%)
    temperature: parseFloat((Math.random() * (40 - 10) + 10).toFixed(2)), // Temperature (10-40°C)
    credits: parseFloat((Math.random() * (5 - 1) + 1).toFixed(2)), // Credits generated (1-5)
    emissions: 0, // No emissions for sequester devices
    offset: false,
    device_type: 'SEQUESTER',
    timestamp: new Date().toISOString(),
  };
}

// Generate credit update data
function generateCreditUpdate(companyId, totalCredits, currentCredits, soldCredits) {
  return {
    companyId: companyId,
    totalCredit: totalCredits,
    currentCredit: currentCredits,
    soldCredit: soldCredits,
    offerPrice: parseFloat((Math.random() * (35 - 20) + 20).toFixed(2)), // $20-35 per credit
    timestamp: new Date().toISOString(),
    action: 'UPDATE_CREDITS'
  };
}

// Initialize companies with API keys and devices
function initializeCompanies() {
  COMPANIES.forEach((company, companyIndex) => {
    console.log(`🏢 Initializing ${company.companyName}...`);
    
    for (let apiKeyIndex = 0; apiKeyIndex < API_KEYS_PER_COMPANY; apiKeyIndex++) {
      const apiKey = generateApiKey();
      company.apiKeys.push(apiKey);
      
      for (let deviceIndex = 0; deviceIndex < DEVICES_PER_API_KEY; deviceIndex++) {
        const deviceId = generateDeviceId(companyIndex, apiKeyIndex, deviceIndex);
        const device = {
          deviceId: deviceId,
          apiKey: apiKey,
          companyId: companyIndex + 1,
          location: `${company.location} - Facility ${Math.floor(Math.random() * 5) + 1}`,
          projectName: `${company.companyName} Project`,
          currentCredits: 0,
          totalCredits: 0
        };
        
        company.devices.push(device);
        deviceData.set(deviceId, {
          ...device,
          ...generateRandomData(),
        });
      }
    }
    
    console.log(`   - ${company.apiKeys.length} API keys`);
    console.log(`   - ${company.devices.length} devices`);
  });
}

// Start MQTT simulation
async function startMQTTSimulation() {
  console.log(`🚀 Starting MQTT simulation for ${NUM_COMPANIES} companies...`);
  
  initializeCompanies();
  
  // Create MQTT clients for each device
  COMPANIES.forEach((company, companyIndex) => {
    company.devices.forEach((device) => {
      const topic = `carbon_credit/${device.apiKey}/sensor_data`;
      const creditTopic = `carbon_credit/${device.apiKey}/credit_update`;
      
      const client = mqtt.connect(MQTT_BROKER, {
        clientId: `simulator_${device.deviceId}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      });

      client.on('connect', () => {
        console.log(`📡 Device ${device.deviceId} connected with API Key ${device.apiKey}`);
        clients.push(client);

        // Start sending sensor data
        setInterval(() => {
          const currentData = deviceData.get(device.deviceId);
          if (currentData) {
            const newData = {
              ...currentData,
              ...generateRandomData(),
              timestamp: new Date().toISOString(),
            };
            
            // Update device credits
            device.currentCredits += newData.credits;
            device.totalCredits += newData.credits;
            newData.currentCredits = device.currentCredits;
            newData.totalCredits = device.totalCredits;
            
            deviceData.set(device.deviceId, newData);

            client.publish(topic, JSON.stringify(newData), err => {
              if (err) {
                console.error(`❌ Failed to publish sensor data for ${device.deviceId}:`, err);
              } else {
                console.log(`📊 Published sensor data for ${device.deviceId} (Credits: ${newData.credits})`);
              }
            });
          }
        }, SEND_INTERVAL_MS);

        // Start sending credit updates
        setInterval(() => {
          const totalCredits = company.devices.reduce((sum, d) => sum + d.totalCredits, 0);
          const currentCredits = company.devices.reduce((sum, d) => sum + d.currentCredits, 0);
          const soldCredits = Math.random() * totalCredits * 0.3; // Simulate some sales
          
          const creditUpdate = generateCreditUpdate(
            companyIndex + 1,
            totalCredits,
            currentCredits - soldCredits,
            soldCredits
          );

          client.publish(creditTopic, JSON.stringify(creditUpdate), err => {
            if (err) {
              console.error(`❌ Failed to publish credit update for ${company.companyName}:`, err);
            } else {
              console.log(`💰 Published credit update for ${company.companyName} (Total: ${totalCredits.toFixed(2)})`);
            }
          });
        }, CREDIT_UPDATE_INTERVAL_MS);
      });

      client.on('error', err => {
        console.error(`❌ MQTT Client Error for ${device.deviceId}:`, err);
      });

      client.on('close', () => {
        console.log(`🔌 MQTT Client Disconnected for ${device.deviceId}`);
      });
    });
  });

  // Display statistics every 30 seconds
  setInterval(() => {
    console.log('\n📊 === SIMULATION STATISTICS ===');
    COMPANIES.forEach((company, index) => {
      const totalCredits = company.devices.reduce((sum, d) => sum + d.totalCredits, 0);
      const currentCredits = company.devices.reduce((sum, d) => sum + d.currentCredits, 0);
      console.log(`${index + 1}. ${company.companyName}:`);
      console.log(`   - Devices: ${company.devices.length}`);
      console.log(`   - Total Credits: ${totalCredits.toFixed(2)}`);
      console.log(`   - Current Credits: ${currentCredits.toFixed(2)}`);
    });
    console.log('===============================\n');
  }, 30000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MQTT simulator...');
  clients.forEach(client => client.end());
  process.exit();
});

// Start the simulation
startMQTTSimulation().catch(console.error);
