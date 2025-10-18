import {
  pgTable,
  text,
  timestamp,
  boolean,
  json,
  integer,
  pgEnum,
  serial,
  decimal,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const deviceTypeEnum = pgEnum('device_type', ['SEQUESTER']);
export const transactionTypeEnum = pgEnum('transaction_type', ['MINT', 'BURN']);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'PENDING',
  'CONFIRMED',
  'FAILED',
]);
export const applicationStatusEnum = pgEnum('application_status', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
]);
export const apiKeyStatusEnum = pgEnum('api_key_status', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'EXPIRED',
]);

// User Table - Simple wallet address storage
export const usertable = pgTable('usertable', {
  walletAddress: varchar('wallet_address', { length: 255 }).primaryKey(),
});

// Company Table
export const company = pgTable('company', {
  companyId: serial('company_id').primaryKey(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  address: varchar('address', { length: 255 }),
  website: varchar('website', { length: 255 }),
  location: varchar('location', { length: 255 }),
  walletAddress: varchar('wallet_address', { length: 255 }).unique(),
});

// Company Credit Table
export const companyCredit = pgTable('company_credit', {
  creditId: serial('credit_id').primaryKey(),
  companyId: integer('company_id').notNull(),
  totalCredit: decimal('total_credit', { precision: 10, scale: 2 }).notNull(), // Total sequestered credits (including sold)
  currentCredit: decimal('current_credit', { precision: 10, scale: 2 }).notNull(), // Current unsold sequestered credits
  soldCredit: decimal('sold_credit', { precision: 10, scale: 2 }).notNull().default('0.00'), // Total sold sequestered credits
  offerPrice: decimal('offer_price', { precision: 10, scale: 2 }), // Offer price for selling sequestered credits
});

// Credit History Table
export const creditHistory = pgTable('credit_history', {
  historyId: serial('history_id').primaryKey(),
  companyId: integer('company_id').notNull(),
  soldAmount: decimal('sold_amount', { precision: 10, scale: 2 }).notNull(),
  soldPrice: decimal('sold_price', { precision: 10, scale: 2 }).notNull(),
  buyerInfo: varchar('buyer_info', { length: 255 }), // Optional buyer information
  saleDate: timestamp('sale_date').defaultNow(),
});

// IoT Keys Table
export const iotKeys = pgTable('iot_keys', {
  keyId: serial('key_id').primaryKey(),
  companyId: integer('company_id').notNull(),
  keyValue: varchar('key_value', { length: 255 }).notNull(),
});

// Device Table
export const device = pgTable('device', {
  deviceId: serial('device_id').primaryKey(),
  keyId: integer('key_id').notNull(),
  companyId: integer('company_id').notNull(),
  sequesteredCarbonCredits: decimal('sequestered_carbon_credits', { precision: 10, scale: 2 }).notNull(),
});

// Device Credit History Table
export const deviceCreditHistory = pgTable('device_credit_history', {
  historyId: serial('history_id').primaryKey(),
  deviceId: integer('device_id').notNull(),
  sequesteredCredits: decimal('sequestered_credits', { precision: 10, scale: 2 }).notNull(),
  timeIntervalStart: timestamp('time_interval_start').notNull(),
  timeIntervalEnd: timestamp('time_interval_end'),
});

// Relations
export const usertableRelations = relations(usertable, ({ many }) => ({
  companies: many(company),
}));

export const companyRelations = relations(company, ({ one, many }) => ({
  user: one(usertable, {
    fields: [company.walletAddress],
    references: [usertable.walletAddress],
  }),
  credits: many(companyCredit),
  creditHistory: many(creditHistory),
  iotKeys: many(iotKeys),
  devices: many(device),
}));

export const companyCreditRelations = relations(companyCredit, ({ one }) => ({
  company: one(company, {
    fields: [companyCredit.companyId],
    references: [company.companyId],
  }),
}));

export const creditHistoryRelations = relations(creditHistory, ({ one }) => ({
  company: one(company, {
    fields: [creditHistory.companyId],
    references: [company.companyId],
  }),
}));

export const iotKeysRelations = relations(iotKeys, ({ one, many }) => ({
  company: one(company, {
    fields: [iotKeys.companyId],
    references: [company.companyId],
  }),
  devices: many(device),
}));

export const deviceRelations = relations(device, ({ one, many }) => ({
  iotKey: one(iotKeys, {
    fields: [device.keyId],
    references: [iotKeys.keyId],
  }),
  company: one(company, {
    fields: [device.companyId],
    references: [company.companyId],
  }),
  creditHistory: many(deviceCreditHistory),
}));

export const deviceCreditHistoryRelations = relations(deviceCreditHistory, ({ one }) => ({
  device: one(device, {
    fields: [deviceCreditHistory.deviceId],
    references: [device.deviceId],
  }),
}));

// Types
export type User = typeof usertable.$inferSelect;
export type NewUser = typeof usertable.$inferInsert;

export type Company = typeof company.$inferSelect;
export type NewCompany = typeof company.$inferInsert;

export type CompanyCredit = typeof companyCredit.$inferSelect;
export type NewCompanyCredit = typeof companyCredit.$inferInsert;

export type CreditHistory = typeof creditHistory.$inferSelect;
export type NewCreditHistory = typeof creditHistory.$inferInsert;

export type IotKey = typeof iotKeys.$inferSelect;
export type NewIotKey = typeof iotKeys.$inferInsert;

export type Device = typeof device.$inferSelect;
export type NewDevice = typeof device.$inferInsert;

export type DeviceCreditHistory = typeof deviceCreditHistory.$inferSelect;
export type NewDeviceCreditHistory = typeof deviceCreditHistory.$inferInsert;