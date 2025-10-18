#!/usr/bin/env tsx

/**
 * Database Seeder for New Schema
 * 
 * This script creates companies, credits, IoT keys, and devices using the new schema
 */

import crypto from 'crypto';
import { db, usertable, company, companyCredit, iotKeys, device, deviceCreditHistory, eq } from '../lib/db';

// Sample companies data
const COMPANIES = [
  {
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    companyName: 'EcoTech Solutions',
    address: '123 Green Street, Eco City',
    website: 'https://ecotech.example.com',
    location: 'San Francisco, CA',
    initialCredits: 1000.50,
    offerPrice: 25.75,
  },
  {
    walletAddress: '0x2345678901bcdef1234567890abcdef1234567890',
    companyName: 'GreenForest Corp',
    address: '456 Forest Avenue, Green Valley',
    website: 'https://greenforest.example.com',
    location: 'Portland, OR',
    initialCredits: 2500.25,
    offerPrice: 22.50,
  },
  {
    walletAddress: '0x3456789012cdef1234567890abcdef12345678901',
    companyName: 'OceanClean Industries',
    address: '789 Ocean Drive, Coastal City',
    website: 'https://oceanclean.example.com',
    location: 'Miami, FL',
    initialCredits: 1800.75,
    offerPrice: 28.00,
  },
  {
    walletAddress: '0x4567890123def1234567890abcdef123456789012',
    companyName: 'UrbanGreen Systems',
    address: '321 Urban Plaza, Metro City',
    website: 'https://urbangreen.example.com',
    location: 'New York, NY',
    initialCredits: 3200.00,
    offerPrice: 30.25,
  },
  {
    walletAddress: '0x5678901234ef1234567890abcdef1234567890123',
    companyName: 'AgriCarbon Ltd',
    address: '654 Farm Road, Rural County',
    website: 'https://agricarbon.example.com',
    location: 'Austin, TX',
    initialCredits: 1500.30,
    offerPrice: 20.50,
  }
];

// Generate API key
function generateApiKey(): string {
  const prefix = 'cc_' + crypto.randomBytes(16).toString('hex');
  return prefix;
}

// Generate device ID
function generateDeviceId(companyIndex: number, keyIndex: number, deviceIndex: number): string {
  return `DEV_${String(companyIndex + 1).padStart(2, '0')}_${String(keyIndex + 1).padStart(2, '0')}_${String(deviceIndex + 1).padStart(2, '0')}`;
}

async function seedNewDatabase() {
  console.log('🌱 Starting database seeding with new schema...');
  
  try {
    console.log('📊 Seeding companies and related data...');
    
    for (let companyIndex = 0; companyIndex < COMPANIES.length; companyIndex++) {
      const companyData = COMPANIES[companyIndex];
      
      // Create user (wallet address)
      console.log(`👤 Creating user: ${companyData.walletAddress}`);
      await db.insert(usertable).values({
        walletAddress: companyData.walletAddress,
      }).onConflictDoNothing();

      // Create company
      console.log(`🏢 Creating company: ${companyData.companyName}`);
      const [newCompany] = await db.insert(company).values({
        companyName: companyData.companyName,
        address: companyData.address,
        website: companyData.website,
        location: companyData.location,
        walletAddress: companyData.walletAddress,
      }).onConflictDoNothing().returning();

      // Get company ID (either from insert or existing)
      let companyId: number;
      if (newCompany) {
        companyId = newCompany.companyId;
      } else {
        const existingCompany = await db.select().from(company)
          .where(eq(company.walletAddress, companyData.walletAddress))
          .limit(1);
        companyId = existingCompany[0].companyId;
      }

      // Create company credit record
      console.log(`💰 Creating credit record for ${companyData.companyName}`);
      await db.insert(companyCredit).values({
        companyId: companyId,
        totalCredit: companyData.initialCredits.toString(),
        currentCredit: companyData.initialCredits.toString(),
        soldCredit: '0.00',
        offerPrice: companyData.offerPrice.toString(),
      }).onConflictDoNothing();

      // Create IoT keys for this company
      console.log(`🔑 Creating IoT keys for ${companyData.companyName}`);
      const keyIds: number[] = [];
      for (let keyIndex = 0; keyIndex < 10; keyIndex++) {
        const apiKey = generateApiKey();
        
        const [newKey] = await db.insert(iotKeys).values({
          companyId: companyId,
          keyValue: apiKey,
        }).onConflictDoNothing().returning();

        if (newKey) {
          keyIds.push(newKey.keyId);
        } else {
          // Get existing key ID
          const existingKey = await db.select().from(iotKeys)
            .where(eq(iotKeys.companyId, companyId))
            .limit(1);
          keyIds.push(existingKey[0].keyId);
        }
      }

      // Create devices for each IoT key
      console.log(`📱 Creating devices for ${companyData.companyName}`);
      for (let keyIndex = 0; keyIndex < keyIds.length; keyIndex++) {
        const deviceCount = 5 + Math.floor(Math.random() * 6); // 5-10 devices per key
        
        for (let deviceIndex = 0; deviceIndex < deviceCount; deviceIndex++) {
          const deviceId = generateDeviceId(companyIndex, keyIndex, deviceIndex);
          const initialCredits = Math.random() * 100 + 10; // 10-110 credits
          
          const [newDevice] = await db.insert(device).values({
            keyId: keyIds[keyIndex],
            companyId: companyId,
            sequesteredCarbonCredits: initialCredits.toString(),
          }).onConflictDoNothing().returning();

          // Create device credit history
          if (newDevice) {
            await db.insert(deviceCreditHistory).values({
              deviceId: newDevice.deviceId,
              sequesteredCredits: initialCredits.toString(),
              timeIntervalStart: new Date(),
              timeIntervalEnd: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours later
            }).onConflictDoNothing();
          }
        }
      }
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${COMPANIES.length} users (wallet addresses)`);
    console.log(`   - ${COMPANIES.length} companies`);
    console.log(`   - ${COMPANIES.length} company credit records`);
    console.log(`   - ${COMPANIES.length * 10} IoT keys`);
    console.log(`   - ~${COMPANIES.length * 10 * 7} devices`);
    console.log(`   - Device credit history records`);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeder
if (import.meta.url === `file://${process.argv[1]}`) {
  seedNewDatabase();
}

export { seedNewDatabase, COMPANIES };
