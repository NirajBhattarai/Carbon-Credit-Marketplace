#!/usr/bin/env node

/**
 * Database Seeder for Carbon Credit Marketplace
 * 
 * This script creates the companies, applications, and API keys that the MQTT simulator uses.
 * It ensures the database has the necessary data for the API endpoints to work.
 */

const crypto = require('crypto');

// Simulated companies with wallet addresses (same as simulator)
const COMPANIES = [
  {
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    username: 'EcoTech Solutions',
    email: 'contact@ecotech.example.com',
    role: 'DEVELOPER',
    application: {
      name: 'EcoTech Carbon Capture',
      description: 'Advanced carbon sequestration technology',
      website: 'https://ecotech.example.com'
    }
  },
  {
    walletAddress: '0x2345678901bcdef1234567890abcdef1234567890',
    username: 'GreenForest Corp',
    email: 'info@greenforest.example.com',
    role: 'DEVELOPER',
    application: {
      name: 'GreenForest Monitoring',
      description: 'Forest carbon monitoring and sequestration',
      website: 'https://greenforest.example.com'
    }
  },
  {
    walletAddress: '0x3456789012cdef1234567890abcdef12345678901',
    username: 'OceanClean Industries',
    email: 'support@oceanclean.example.com',
    role: 'DEVELOPER',
    application: {
      name: 'OceanClean Carbon',
      description: 'Ocean-based carbon sequestration systems',
      website: 'https://oceanclean.example.com'
    }
  },
  {
    walletAddress: '0x4567890123def1234567890abcdef123456789012',
    username: 'UrbanGreen Systems',
    email: 'hello@urbangreen.example.com',
    role: 'DEVELOPER',
    application: {
      name: 'UrbanGreen Monitoring',
      description: 'Urban carbon capture and monitoring',
      website: 'https://urbangreen.example.com'
    }
  },
  {
    walletAddress: '0x5678901234ef1234567890abcdef1234567890123',
    username: 'AgriCarbon Ltd',
    email: 'contact@agricarbon.example.com',
    role: 'DEVELOPER',
    application: {
      name: 'AgriCarbon Solutions',
      description: 'Agricultural carbon sequestration technology',
      website: 'https://agricarbon.example.com'
    }
  }
];

// Generate API key (same format as simulator)
function generateApiKey() {
  const prefix = 'cc_' + crypto.randomBytes(16).toString('hex');
  return prefix;
}

// Generate device ID (same format as simulator)
function generateDeviceId(companyIndex, apiKeyIndex, deviceIndex) {
  return `DEV_${String(companyIndex + 1).padStart(2, '0')}_${String(apiKeyIndex + 1).padStart(2, '0')}_${String(deviceIndex + 1).padStart(2, '0')}`;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Import the database connection
    const { db, users, applications, apiKeys, iotDevices, eq } = require('../lib/db/index.ts');
    
    console.log('📊 Seeding companies and applications...');
    
    for (let companyIndex = 0; companyIndex < COMPANIES.length; companyIndex++) {
      const company = COMPANIES[companyIndex];
      
      // Create or update user
      console.log(`👤 Creating user: ${company.username}`);
      await db.insert(users).values({
        walletAddress: company.walletAddress,
        username: company.username,
        email: company.email,
        role: company.role,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: users.walletAddress,
        set: {
          username: company.username,
          email: company.email,
          role: company.role,
          updatedAt: new Date(),
        }
      });

      // Create application
      console.log(`📱 Creating application: ${company.application.name}`);
      const [application] = await db.insert(applications).values({
        walletAddress: company.walletAddress,
        name: company.application.name,
        description: company.application.description,
        website: company.application.website,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing().returning();

      // Get the application ID (either from insert or existing)
      let applicationId;
      if (application) {
        applicationId = application.id;
      } else {
        const existingApp = await db.select().from(applications)
          .where(eq(applications.walletAddress, company.walletAddress))
          .limit(1);
        applicationId = existingApp[0].id;
      }

      // Create API keys for this application
      console.log(`🔑 Creating API keys for ${company.application.name}`);
      for (let apiKeyIndex = 0; apiKeyIndex < 10; apiKeyIndex++) {
        const fullApiKey = generateApiKey();
        const keyPrefix = fullApiKey.substring(3); // Remove 'cc_' prefix
        
        await db.insert(apiKeys).values({
          applicationId: applicationId,
          keyHash: crypto.createHash('sha256').update(fullApiKey).digest('hex'),
          keyPrefix: keyPrefix,
          name: `${company.application.name} API Key ${apiKeyIndex + 1}`,
          status: 'ACTIVE',
          permissions: ['read:devices', 'write:devices'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }).onConflictDoNothing();

        // Create devices for this API key
        const deviceCount = 5 + Math.floor(Math.random() * 6); // 5-10 devices
        for (let deviceIndex = 0; deviceIndex < deviceCount; deviceIndex++) {
          const deviceId = generateDeviceId(companyIndex, apiKeyIndex, deviceIndex);
          
          await db.insert(iotDevices).values({
            deviceId: deviceId,
            walletAddress: company.walletAddress,
            deviceType: 'SEQUESTER',
            location: `${company.username} Facility ${Math.floor(Math.random() * 5) + 1}`,
            projectName: `${company.application.name} Project`,
            description: `Device auto-created for ${company.application.name}`,
            isActive: true,
            lastSeen: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }).onConflictDoNothing();
        }
      }
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${COMPANIES.length} companies`);
    console.log(`   - ${COMPANIES.length} applications`);
    console.log(`   - ${COMPANIES.length * 10} API keys`);
    console.log(`   - ~${COMPANIES.length * 10 * 7} devices`);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, COMPANIES };
