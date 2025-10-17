import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client'

// InfluxDB Configuration
const INFLUX_CONFIG = {
  url: process.env.INFLUXDB_URL || 'http://localhost:8086',
  token: process.env.INFLUXDB_TOKEN || 'carbon-credit-token-123',
  org: process.env.INFLUXDB_ORG || 'carbon-credit-org',
  bucket: process.env.INFLUXDB_BUCKET || 'mqtt-data',
}

// InfluxDB client instance
let influxDB: InfluxDB | null = null
let writeApi: WriteApi | null = null

/**
 * Initialize InfluxDB connection
 */
export function initializeInfluxDB(): boolean {
  try {
    influxDB = new InfluxDB({
      url: INFLUX_CONFIG.url,
      token: INFLUX_CONFIG.token,
    })

    writeApi = influxDB.getWriteApi(INFLUX_CONFIG.org, INFLUX_CONFIG.bucket)
    
    console.log('✅ InfluxDB initialized successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize InfluxDB:', error)
    return false
  }
}

/**
 * Write MQTT sensor data to InfluxDB with wallet address as primary key
 */
export async function writeSensorData(data: {
  deviceId: string
  deviceType: 'SEQUESTER' | 'EMITTER'
  apiKey?: string
  walletAddress?: string
  co2: number
  humidity: number
  credits: number
  emissions: number
  offset: boolean
  timestamp: number
  location?: string
  ip?: string
  mac?: string
}): Promise<boolean> {
  if (!writeApi) {
    console.error('❌ InfluxDB not initialized - cannot write sensor data')
    return false
  }

  try {
    // Use wallet address as primary identifier, fallback to device ID
    const primaryKey = data.walletAddress || data.deviceId || 'unknown'
    
    // Create a data point with wallet address as the primary key
    const point = new Point('sensor_data')
      // Primary key: wallet address (most important for carbon credit tracking)
      .tag('wallet_address', data.walletAddress || 'unknown')
      .tag('device_id', data.deviceId)
      .tag('device_type', data.deviceType)
      .tag('api_key', data.apiKey || 'unknown')
      .tag('location', data.location || 'unknown')
      .tag('ip', data.ip || 'unknown')
      .tag('mac', data.mac || 'unknown')
      // Sensor data fields
      .floatField('co2', data.co2)
      .floatField('humidity', data.humidity)
      .floatField('credits', data.credits)
      .floatField('emissions', data.emissions)
      .booleanField('offset', data.offset)
      .timestamp(new Date(data.timestamp))

    // Write the point to InfluxDB
    writeApi.writePoint(point)
    
    // Flush to ensure data is written immediately
    await writeApi.flush()
    
    console.log(`✅ Sensor data written to InfluxDB with wallet key: ${data.walletAddress ? data.walletAddress.slice(0, 6) + '...' + data.walletAddress.slice(-4) : 'unknown'} (device: ${data.deviceId})`)
    return true
  } catch (error) {
    console.error('❌ Failed to write sensor data to InfluxDB:', error)
    console.error('Data details:', {
      deviceId: data.deviceId,
      walletAddress: data.walletAddress ? data.walletAddress.slice(0, 6) + '...' + data.walletAddress.slice(-4) : 'unknown',
      deviceType: data.deviceType,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return false
  }
}

/**
 * Write device connection events to InfluxDB with wallet address as primary key
 */
export async function writeConnectionEvent(data: {
  deviceId: string
  deviceType: 'SEQUESTER' | 'EMITTER'
  apiKey?: string
  walletAddress?: string
  event: 'connected' | 'disconnected' | 'error'
  timestamp: number
  error?: string
}): Promise<boolean> {
  if (!writeApi) {
    console.error('❌ InfluxDB not initialized - cannot write connection event')
    return false
  }

  try {
    // Create connection event point with wallet address as primary key
    const point = new Point('device_events')
      // Primary key: wallet address (most important for tracking user devices)
      .tag('wallet_address', data.walletAddress || 'unknown')
      .tag('device_id', data.deviceId)
      .tag('device_type', data.deviceType)
      .tag('api_key', data.apiKey || 'unknown')
      .tag('event', data.event)
      .stringField('error', data.error || '')
      .timestamp(new Date(data.timestamp))

    writeApi.writePoint(point)
    await writeApi.flush()
    
    console.log(`✅ Connection event written to InfluxDB with wallet key: ${data.walletAddress ? data.walletAddress.slice(0, 6) + '...' + data.walletAddress.slice(-4) : 'unknown'} - ${data.event} (device: ${data.deviceId})`)
    return true
  } catch (error) {
    console.error('❌ Failed to write connection event to InfluxDB:', error)
    console.error('Event details:', {
      deviceId: data.deviceId,
      walletAddress: data.walletAddress ? data.walletAddress.slice(0, 6) + '...' + data.walletAddress.slice(-4) : 'unknown',
      event: data.event,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return false
  }
}

/**
 * Close InfluxDB connection
 */
export function closeInfluxDB(): void {
  if (writeApi) {
    writeApi.close()
    writeApi = null
  }
  influxDB = null
  console.log('🔌 InfluxDB connection closed')
}

/**
 * Get InfluxDB client for custom queries
 */
export function getInfluxDBClient(): InfluxDB | null {
  return influxDB
}

export { INFLUX_CONFIG }
