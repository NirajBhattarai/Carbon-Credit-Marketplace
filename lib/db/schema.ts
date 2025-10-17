import { pgTable, text, timestamp, boolean, json, integer, pgEnum, serial, decimal, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Helper function to generate UUID
const generateId = () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Enums
export const deviceTypeEnum = pgEnum('device_type', ['SEQUESTER', 'EMITTER'])
export const transactionTypeEnum = pgEnum('transaction_type', ['MINT', 'BURN'])
export const transactionStatusEnum = pgEnum('transaction_status', ['PENDING', 'CONFIRMED', 'FAILED'])
export const userRoleEnum = pgEnum('user_role', ['USER', 'DEVELOPER', 'ADMIN'])
export const applicationStatusEnum = pgEnum('application_status', ['ACTIVE', 'INACTIVE', 'SUSPENDED'])
export const apiKeyStatusEnum = pgEnum('api_key_status', ['ACTIVE', 'INACTIVE', 'REVOKED'])

// Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(generateId),
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
  // Single API Key field
  apiKey: text('api_key').unique(),
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

// User Carbon Credits Table
export const userCarbonCredits = pgTable('user_carbon_credits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  credits: decimal('credits', { precision: 18, scale: 8 }).notNull().default('0'),
  co2Reduced: decimal('co2_reduced', { precision: 10, scale: 2 }).notNull().default('0'),
  energySaved: decimal('energy_saved', { precision: 10, scale: 2 }).notNull().default('0'),
  temperatureImpact: decimal('temperature_impact', { precision: 5, scale: 2 }).notNull().default('0'),
  humidityImpact: decimal('humidity_impact', { precision: 5, scale: 2 }).notNull().default('0'),
  isOnline: boolean('is_online').notNull().default(false),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// User Credit History Table
export const userCreditHistory = pgTable('user_credit_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  creditsEarned: decimal('credits_earned', { precision: 18, scale: 8 }).notNull(),
  co2Reduced: decimal('co2_reduced', { precision: 10, scale: 2 }).notNull(),
  energySaved: decimal('energy_saved', { precision: 10, scale: 2 }).notNull(),
  temperatureImpact: decimal('temperature_impact', { precision: 5, scale: 2 }).notNull(),
  humidityImpact: decimal('humidity_impact', { precision: 5, scale: 2 }).notNull(),
  source: text('source').notNull(), // 'IOT_DEVICE', 'MANUAL', 'REFERRAL', etc.
  sourceId: text('source_id'), // device_id or other source identifier
  metadata: json('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  carbonCredits: many(userCarbonCredits),
  creditHistory: many(userCreditHistory),
}))

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  iotDevices: many(iotDevices),
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

export const userCarbonCreditsRelations = relations(userCarbonCredits, ({ one }) => ({
  user: one(users, {
    fields: [userCarbonCredits.userId],
    references: [users.id],
  }),
}))

export const userCreditHistoryRelations = relations(userCreditHistory, ({ one }) => ({
  user: one(users, {
    fields: [userCreditHistory.userId],
    references: [users.id],
  }),
}))

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Application = typeof applications.$inferSelect
export type NewApplication = typeof applications.$inferInsert
export type IoTDevice = typeof iotDevices.$inferSelect
export type NewIoTDevice = typeof iotDevices.$inferInsert
export type DeviceData = typeof deviceData.$inferSelect
export type NewDeviceData = typeof deviceData.$inferInsert
export type CarbonCreditTransaction = typeof carbonCreditTransactions.$inferSelect
export type NewCarbonCreditTransaction = typeof carbonCreditTransactions.$inferInsert
export type UserCarbonCredits = typeof userCarbonCredits.$inferSelect
export type NewUserCarbonCredits = typeof userCarbonCredits.$inferInsert
export type UserCreditHistory = typeof userCreditHistory.$inferSelect
export type NewUserCreditHistory = typeof userCreditHistory.$inferInsert
export type UserRole = typeof userRoleEnum.enumValues[number]
export type ApplicationStatus = typeof applicationStatusEnum.enumValues[number]
export type ApiKeyStatus = typeof apiKeyStatusEnum.enumValues[number]
export type DeviceType = typeof deviceTypeEnum.enumValues[number]
export type TransactionType = typeof transactionTypeEnum.enumValues[number]
export type TransactionStatus = typeof transactionStatusEnum.enumValues[number]
