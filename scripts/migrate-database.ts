#!/usr/bin/env tsx

/**
 * Database Migration Script
 * 
 * This script migrates from the old schema to the new company-based schema
 */

import { db, usertable, company, companyCredit, iotKeys, device, deviceCreditHistory } from '../lib/db';

async function migrateDatabase() {
  console.log('🔄 Starting database migration...');
  
  try {
    // Drop old tables if they exist
    console.log('🗑️ Dropping old tables...');
    await db.execute(`
      DROP TABLE IF EXISTS device_credit_history CASCADE;
      DROP TABLE IF EXISTS device CASCADE;
      DROP TABLE IF EXISTS iot_keys CASCADE;
      DROP TABLE IF EXISTS credit_history CASCADE;
      DROP TABLE IF EXISTS company_credit CASCADE;
      DROP TABLE IF EXISTS company CASCADE;
      DROP TABLE IF EXISTS usertable CASCADE;
      DROP TABLE IF EXISTS api_keys CASCADE;
      DROP TABLE IF EXISTS applications CASCADE;
      DROP TABLE IF EXISTS iot_devices CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS carbon_credits CASCADE;
    `);

    // Drop old enums
    console.log('🗑️ Dropping old enums...');
    await db.execute(`
      DROP TYPE IF EXISTS device_type CASCADE;
      DROP TYPE IF EXISTS transaction_type CASCADE;
      DROP TYPE IF EXISTS transaction_status CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
      DROP TYPE IF EXISTS application_status CASCADE;
      DROP TYPE IF EXISTS api_key_status CASCADE;
    `);

    // Create new enums
    console.log('📝 Creating new enums...');
    await db.execute(`
      CREATE TYPE device_type AS ENUM ('SEQUESTER');
      CREATE TYPE transaction_type AS ENUM ('MINT', 'BURN');
      CREATE TYPE transaction_status AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');
      CREATE TYPE user_role AS ENUM ('USER', 'DEVELOPER', 'ADMIN');
      CREATE TYPE application_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
      CREATE TYPE api_key_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED');
    `);

    // Create new tables
    console.log('📝 Creating new tables...');
    await db.execute(`
      CREATE TABLE usertable (
        wallet_address VARCHAR(255) PRIMARY KEY
      );

      CREATE TABLE company (
        company_id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        website VARCHAR(255),
        location VARCHAR(255),
        wallet_address VARCHAR(255) UNIQUE,
        FOREIGN KEY (wallet_address) REFERENCES usertable(wallet_address)
      );

      CREATE TABLE company_credit (
        credit_id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL,
        total_credit DECIMAL(10, 2) NOT NULL,
        current_credit DECIMAL(10, 2) NOT NULL,
        sold_credit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        offer_price DECIMAL(10, 2),
        FOREIGN KEY (company_id) REFERENCES company(company_id)
      );

      CREATE TABLE credit_history (
        history_id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL,
        sold_amount DECIMAL(10, 2) NOT NULL,
        sold_price DECIMAL(10, 2) NOT NULL,
        buyer_info VARCHAR(255),
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES company(company_id)
      );

      CREATE TABLE iot_keys (
        key_id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL,
        key_value VARCHAR(255) NOT NULL,
        FOREIGN KEY (company_id) REFERENCES company(company_id)
      );

      CREATE TABLE device (
        device_id SERIAL PRIMARY KEY,
        key_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        sequestered_carbon_credits DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (key_id) REFERENCES iot_keys(key_id),
        FOREIGN KEY (company_id) REFERENCES company(company_id)
      );

      CREATE TABLE device_credit_history (
        history_id SERIAL PRIMARY KEY,
        device_id INTEGER NOT NULL,
        sequestered_credits DECIMAL(10, 2) NOT NULL,
        time_interval_start TIMESTAMP NOT NULL,
        time_interval_end TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES device(device_id)
      );
    `);

    console.log('✅ Database migration completed successfully!');
    console.log('📊 New schema created with:');
    console.log('   - usertable (wallet addresses)');
    console.log('   - company (company information)');
    console.log('   - company_credit (credit management)');
    console.log('   - credit_history (sales history)');
    console.log('   - iot_keys (API keys)');
    console.log('   - device (IoT devices)');
    console.log('   - device_credit_history (device credit tracking)');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDatabase();
}

export { migrateDatabase };
