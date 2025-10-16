import { pgTable, text, timestamp, boolean, json, integer, pgEnum, serial, decimal } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const deviceTypeEnum = pgEnum('device_type', ['CREATOR', 'BURNER'])
export const transactionTypeEnum = pgEnum('transaction_type', ['MINT', 'BURN'])
export const transactionStatusEnum = pgEnum('transaction_status', ['PENDING', 'CONFIRMED', 'FAILED'])

// IoT Devices Table
export const iotDevices = pgTable('iot_devices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  deviceId: text('device_id').notNull().unique(),
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
export const iotDevicesRelations = relations(iotDevices, ({ many }) => ({
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
export type IoTDevice = typeof iotDevices.$inferSelect
export type NewIoTDevice = typeof iotDevices.$inferInsert
export type DeviceData = typeof deviceData.$inferSelect
export type NewDeviceData = typeof deviceData.$inferInsert
export type CarbonCreditTransaction = typeof carbonCreditTransactions.$inferSelect
export type NewCarbonCreditTransaction = typeof carbonCreditTransactions.$inferInsert
export type DeviceType = typeof deviceTypeEnum.enumValues[number]
export type TransactionType = typeof transactionTypeEnum.enumValues[number]
export type TransactionStatus = typeof transactionStatusEnum.enumValues[number]
