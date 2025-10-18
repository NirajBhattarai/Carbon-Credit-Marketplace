#!/usr/bin/env node

/**
 * MQTT Data Simulator for Carbon Credit Marketplace
 * 
 * This script simulates multiple companies with applications, API keys, and IoT devices
 * sending continuous data to the MQTT broker to demonstrate the sequester-only system.
 * 
 * Structure:
 * - 5 Companies (wallet addresses)
 * - Each company has 1 application
 * - Each application has 10 API keys
 * - Each API key is associated with 5-10 IoT devices
 * - All devices are SEQUESTER type
 */

const mqtt = require('mqtt');
const crypto = require('crypto');

// Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'ws://localhost:9001';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

// Simulated companies with wallet addresses
const COMPANIES = [
  {
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'EcoTech Solutions',
    application: {
      name: 'EcoTech Carbon Capture',
      description: 'Advanced carbon sequestration technology',
      website: 'https://ecotech.example.com'
    }
  },
  {
    walletAddress: '0x2345678901bcdef1234567890abcdef1234567890',
    name: 'GreenForest Corp',
    application: {
      name: 'GreenForest Monitoring',
      description: 'Forest carbon monitoring and sequestration',
      website: 'https://greenforest.example.com'
    }
  },
  {
    walletAddress: '0x3456789012cdef1234567890abcdef12345678901',
    name: 'OceanClean Industries',
    application: {
      name: 'OceanClean Carbon',
      description: 'Ocean-based carbon sequestration systems',
      website: 'https://oceanclean.example.com'
    }
  },
  {
    walletAddress: '0x4567890123def1234567890abcdef123456789012',
    name: 'UrbanGreen Systems',
    application: {
      name: 'UrbanGreen Monitoring',
      description: 'Urban carbon capture and monitoring',
      website: 'https://urbangreen.example.com'
    }
  },
  {
    walletAddress: '0x5678901234ef1234567890abcdef1234567890123',
    name: 'AgriCarbon Ltd',
    application: {
      name: 'AgriCarbon Solutions',
      description: 'Agricultural carbon sequestration technology',
      website: 'https://agricarbon.example.com'
    }
  }
];

// Generate API keys for each company
function generateApiKey() {
  const prefix = 'cc_' + crypto.randomBytes(16).toString('hex');
  return prefix;
}

// Generate device ID
function generateDeviceId(companyIndex, apiKeyIndex, deviceIndex) {
  return `DEV_${String(companyIndex + 1).padStart(2, '0')}_${String(apiKeyIndex + 1).padStart(2, '0')}_${String(deviceIndex + 1).padStart(2, '0')}`;
}

// Generate realistic sensor data
function generateSensorData(deviceId, companyIndex) {
  const baseCO2 = 400; // Base atmospheric CO2
  const sequestrationRate = 50 + Math.random() * 100; // 50-150 ppm reduction
  const energyEfficiency = 0.8 + Math.random() * 0.2; // 80-100% efficiency
  
  const co2Reduction = sequestrationRate * energyEfficiency;
  const creditsEarned = Math.floor(co2Reduction / 100); // 1 credit per 100 ppm reduction
  
  return {
    device_id: deviceId,
    device_type: 'SEQUESTER',
    type: 'sequester',
    mac: crypto.randomBytes(6).toString('hex'),
    ip: `192.168.${companyIndex + 1}.${Math.floor(Math.random() * 254) + 1}`,
    location: `${COMPANIES[companyIndex].name} Facility ${Math.floor(Math.random() * 5) + 1}`,
    version: '2.1.0',
    
    // Sensor readings
    c: Math.max(0, baseCO2 - co2Reduction), // CO2 level after sequestration
    h: 40 + Math.random() * 40, // Humidity 40-80%
    t: 20 + Math.random() * 15, // Temperature 20-35°C
    
    // Calculated values
    cr: creditsEarned, // Carbon credits earned
    e: co2Reduction, // Emissions reduced
    o: true, // Offset status (always true for sequester)
    
    // Additional metrics
    avg_c: Math.max(0, baseCO2 - co2Reduction * 0.9),
    max_c: Math.max(0, baseCO2 - co2Reduction * 0.7),
    min_c: Math.max(0, baseCO2 - co2Reduction * 1.1),
    
    avg_h: 50 + Math.random() * 20,
    max_h: 60 + Math.random() * 20,
    min_h: 40 + Math.random() * 20,
    
    avg_t: 25 + Math.random() * 10,
    max_t: 30 + Math.random() * 10,
    min_t: 20 + Math.random() * 10,
    
    // Device status
    status: 'active',
    uptime: Math.floor(Math.random() * 86400), // Up to 24 hours
    rssi: -30 - Math.random() * 50, // Signal strength
    
    // Timestamp
    t: Date.now()
  };
}

// Generate heartbeat data
function generateHeartbeatData(deviceId, companyIndex) {
  return {
    device_id: deviceId,
    device_type: 'SEQUESTER',
    type: 'heartbeat',
    status: 'online',
    uptime: Math.floor(Math.random() * 86400),
    rssi: -30 - Math.random() * 50,
    battery: 80 + Math.random() * 20, // Battery level
    memory_usage: 20 + Math.random() * 60, // Memory usage %
    cpu_usage: 10 + Math.random() * 40, // CPU usage %
    t: Date.now()
  };
}

// Generate alert data (occasionally)
function generateAlertData(deviceId, companyIndex) {
  const alertTypes = ['maintenance_due', 'calibration_needed', 'performance_degradation'];
  const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
  
  return {
    device_id: deviceId,
    device_type: 'SEQUESTER',
    type: 'alert',
    alert_type: alertType,
    severity: Math.random() > 0.7 ? 'high' : 'medium',
    message: `Device ${deviceId} requires attention: ${alertType.replace('_', ' ')}`,
    t: Date.now()
  };
}

// Main simulation class
class MQTTDataSimulator {
  constructor() {
    this.client = null;
    this.devices = new Map();
    this.isRunning = false;
    this.intervals = new Map();
    
    // Generate all devices for all companies
    this.generateDevices();
  }

  generateDevices() {
    COMPANIES.forEach((company, companyIndex) => {
      // Generate 10 API keys for each company
      for (let apiKeyIndex = 0; apiKeyIndex < 10; apiKeyIndex++) {
        const apiKey = generateApiKey();
        
        // Generate 5-10 devices per API key
        const deviceCount = 5 + Math.floor(Math.random() * 6); // 5-10 devices
        
        for (let deviceIndex = 0; deviceIndex < deviceCount; deviceIndex++) {
          const deviceId = generateDeviceId(companyIndex, apiKeyIndex, deviceIndex);
          
          this.devices.set(deviceId, {
            deviceId,
            apiKey,
            company: company,
            companyIndex,
            apiKeyIndex,
            deviceIndex,
            lastSensorData: null,
            lastHeartbeat: null,
            lastAlert: null
          });
        }
      }
    });
    
    console.log(`Generated ${this.devices.size} devices across ${COMPANIES.length} companies`);
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`Connecting to MQTT broker: ${MQTT_BROKER}`);
      
      this.client = mqtt.connect(MQTT_BROKER, {
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        clientId: `carbon_simulator_${crypto.randomBytes(8).toString('hex')}`,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to MQTT broker');
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
        reject(error);
      });

      this.client.on('reconnect', () => {
        console.log('🔄 Reconnecting to MQTT broker...');
      });

      this.client.on('close', () => {
        console.log('🔌 MQTT connection closed');
      });
    });
  }

  startSimulation() {
    if (this.isRunning) {
      console.log('⚠️  Simulation is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting MQTT data simulation...');
    console.log(`📊 Simulating ${this.devices.size} devices across ${COMPANIES.length} companies`);

    // Start sending data for each device
    this.devices.forEach((device, deviceId) => {
      this.startDeviceSimulation(device);
    });

    // Display summary every 30 seconds
    this.intervals.set('summary', setInterval(() => {
      this.displaySummary();
    }, 30000));
  }

  startDeviceSimulation(device) {
    const { deviceId, apiKey } = device;
    
    // Send sensor data every 10-30 seconds
    const sensorInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(sensorInterval);
        return;
      }
      
      const sensorData = generateSensorData(deviceId, device.companyIndex);
      device.lastSensorData = sensorData;
      
      const topic = `carbon_credit/${apiKey}/sensor_data`;
      const payload = JSON.stringify(sensorData);
      
      this.client.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
          console.error(`❌ Failed to publish sensor data for ${deviceId}:`, error);
        }
      });
    }, 10000 + Math.random() * 20000); // 10-30 seconds

    // Send heartbeat every 60-120 seconds
    const heartbeatInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(heartbeatInterval);
        return;
      }
      
      const heartbeatData = generateHeartbeatData(deviceId, device.companyIndex);
      device.lastHeartbeat = heartbeatData;
      
      const topic = `carbon_credit/${apiKey}/heartbeat`;
      const payload = JSON.stringify(heartbeatData);
      
      this.client.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
          console.error(`❌ Failed to publish heartbeat for ${deviceId}:`, error);
        }
      });
    }, 60000 + Math.random() * 60000); // 60-120 seconds

    // Send alerts occasionally (5% chance every 5 minutes)
    const alertInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(alertInterval);
        return;
      }
      
      if (Math.random() < 0.05) { // 5% chance
        const alertData = generateAlertData(deviceId, device.companyIndex);
        device.lastAlert = alertData;
        
        const topic = `carbon_credit/${apiKey}/alert`;
        const payload = JSON.stringify(alertData);
        
        this.client.publish(topic, payload, { qos: 1 }, (error) => {
          if (error) {
            console.error(`❌ Failed to publish alert for ${deviceId}:`, error);
          }
        });
      }
    }, 300000); // Every 5 minutes

    // Store intervals for cleanup
    this.intervals.set(`${deviceId}_sensor`, sensorInterval);
    this.intervals.set(`${deviceId}_heartbeat`, heartbeatInterval);
    this.intervals.set(`${deviceId}_alert`, alertInterval);
  }

  displaySummary() {
    console.log('\n📊 === SIMULATION SUMMARY ===');
    console.log(`🏢 Companies: ${COMPANIES.length}`);
    console.log(`🔑 Total API Keys: ${COMPANIES.length * 10}`);
    console.log(`📱 Total Devices: ${this.devices.size}`);
    console.log(`🔄 Running: ${this.isRunning ? 'Yes' : 'No'}`);
    
    // Show data for each company
    COMPANIES.forEach((company, index) => {
      const companyDevices = Array.from(this.devices.values())
        .filter(device => device.companyIndex === index);
      
      console.log(`\n🏢 ${company.name} (${company.walletAddress.slice(0, 10)}...)`);
      console.log(`   📱 Devices: ${companyDevices.length}`);
      console.log(`   🔑 API Keys: 10`);
      
      // Show sample device data
      if (companyDevices.length > 0) {
        const sampleDevice = companyDevices[0];
        if (sampleDevice.lastSensorData) {
          const data = sampleDevice.lastSensorData;
          console.log(`   📊 Sample Data: CO2=${data.c.toFixed(1)}ppm, Credits=${data.cr}, Temp=${data.t.toFixed(1)}°C`);
        }
      }
    });
    
    console.log('\n💡 Check the Carbon Credit Marketplace UI to see the data!');
    console.log('==========================================\n');
  }

  stopSimulation() {
    if (!this.isRunning) {
      console.log('⚠️  Simulation is not running');
      return;
    }

    console.log('🛑 Stopping MQTT data simulation...');
    this.isRunning = false;

    // Clear all intervals
    this.intervals.forEach((interval, key) => {
      clearInterval(interval);
    });
    this.intervals.clear();

    console.log('✅ Simulation stopped');
  }

  async disconnect() {
    if (this.client) {
      this.stopSimulation();
      this.client.end();
      console.log('🔌 Disconnected from MQTT broker');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (global.simulator) {
    await global.simulator.disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (global.simulator) {
    await global.simulator.disconnect();
  }
  process.exit(0);
});

// Main execution
async function main() {
  try {
    console.log('🌱 Carbon Credit Marketplace MQTT Data Simulator');
    console.log('===============================================');
    
    const simulator = new MQTTDataSimulator();
    global.simulator = simulator;
    
    await simulator.connect();
    simulator.startSimulation();
    
    console.log('\n🎯 Simulation is running! Press Ctrl+C to stop.');
    console.log('📱 Open the Carbon Credit Marketplace UI to see the data.');
    
  } catch (error) {
    console.error('❌ Failed to start simulation:', error);
    process.exit(1);
  }
}

// Run the simulation
if (require.main === module) {
  main();
}

module.exports = MQTTDataSimulator;
