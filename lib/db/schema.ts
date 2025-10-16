import { pgTable, text, timestamp, boolean, json, integer, pgEnum, serial, decimal, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const deviceTypeEnum = pgEnum('device_type', ['CREATOR', 'BURNER'])
export const transactionTypeEnum = pgEnum('transaction_type', ['MINT', 'BURN'])
export const transactionStatusEnum = pgEnum('transaction_status', ['PENDING', 'CONFIRMED', 'FAILED'])
export const userRoleEnum = pgEnum('user_role', ['USER', 'DEVELOPER', 'ADMIN'])
export const applicationStatusEnum = pgEnum('application_status', ['ACTIVE', 'INACTIVE', 'SUSPENDED'])
export const apiKeyStatusEnum = pgEnum('api_key_status', ['ACTIVE', 'INACTIVE', 'REVOKED'])

// Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  walletAddress: text('wallet_address').notNull().unique(),
  username: text('username').unique(),
  email: text('email').unique(),
  role: userRoleEnum('role').notNull().default('USER'),
  isVerified: boolean('is_verified').notNull().default(false),
  profileData: json('profile_data'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Applications Table
export const applications = pgTable('applications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  website: text('website'),
  status: applicationStatusEnum('status').notNull().default('ACTIVE'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// API Keys Table
export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicationId: text('application_id').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  name: text('name').notNull(),
  status: apiKeyStatusEnum('status').notNull().default('ACTIVE'),
  lastUsed: timestamp('last_used'),
  expiresAt: timestamp('expires_at'),
  permissions: json('permissions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// IoT Devices Table
export const iotDevices = pgTable('iot_devices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  deviceId: text('device_id').notNull().unique(),
  applicationId: text('application_id').notNull(),
  deviceType: deviceTypeEnum('device_type').notNull(),
  location: text('location').notNull(),
  projectName: text('project_name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  lastSeen: timestamp('last_seen'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Device Data Table
export const deviceData = pgTable('device_data', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  deviceId: text('device_id').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  co2Value: decimal('co2_value', { precision: 10, scale: 2 }).notNull(),
  energyValue: decimal('energy_value', { precision: 10, scale: 2 }).notNull(),
  temperature: decimal('temperature', { precision: 5, scale: 2 }).notNull(),
  humidity: decimal('humidity', { precision: 5, scale: 2 }).notNull(),
  dataHash: text('data_hash').notNull(),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Carbon Credit Transactions Table
export const carbonCreditTransactions = pgTable('carbon_credit_transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  deviceId: text('device_id').notNull(),
  transactionType: transactionTypeEnum('transaction_type').notNull(),
  amount: decimal('amount', { precision: 18, scale: 8 }).notNull(),
  blockchainTxHash: text('blockchain_tx_hash'),
  status: transactionStatusEnum('status').notNull().default('PENDING'),
  data: json('data'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
}))

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  apiKeys: many(apiKeys),
  iotDevices: many(iotDevices),
}))

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  application: one(applications, {
    fields: [apiKeys.applicationId],
    references: [applications.id],
  }),
}))

export const iotDevicesRelations = relations(iotDevices, ({ one, many }) => ({
  application: one(applications, {
    fields: [iotDevices.applicationId],
    references: [applications.id],
  }),
  deviceData: many(deviceData),
  transactions: many(carbonCreditTransactions),
}))

export const deviceDataRelations = relations(deviceData, ({ one }) => ({
  device: one(iotDevices, {
    fields: [deviceData.deviceId],
    references: [iotDevices.deviceId],
  }),
}))

export const carbonCreditTransactionsRelations = relations(carbonCreditTransactions, ({ one }) => ({
  device: one(iotDevices, {
    fields: [carbonCreditTransactions.deviceId],
    references: [iotDevices.deviceId],
  }),
}))

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Application = typeof applications.$inferSelect
export type NewApplication = typeof applications.$inferInsert
export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
export type IoTDevice = typeof iotDevices.$inferSelect
export type NewIoTDevice = typeof iotDevices.$inferInsert
export type DeviceData = typeof deviceData.$inferSelect
export type NewDeviceData = typeof deviceData.$inferInsert
export type CarbonCreditTransaction = typeof carbonCreditTransactions.$inferSelect
export type NewCarbonCreditTransaction = typeof carbonCreditTransactions.$inferInsert
export type UserRole = typeof userRoleEnum.enumValues[number]
export type ApplicationStatus = typeof applicationStatusEnum.enumValues[number]
export type ApiKeyStatus = typeof apiKeyStatusEnum.enumValues[number]
export type DeviceType = typeof deviceTypeEnum.enumValues[number]
export type TransactionType = typeof transactionTypeEnum.enumValues[number]
export type TransactionStatus = typeof transactionStatusEnum.enumValues[number]
