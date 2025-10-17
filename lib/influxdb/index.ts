import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';

// InfluxDB Configuration
const INFLUX_CONFIG = {
  url: process.env.INFLUXDB_URL || 'http://localhost:8086',
  token: process.env.INFLUXDB_TOKEN || 'carbon-credit-token-123',
  org: process.env.INFLUXDB_ORG || 'carbon-credit-org',
  bucket: process.env.INFLUXDB_BUCKET || 'mqtt-data',
};

// InfluxDB client instance
let influxDB: InfluxDB | null = null;
let writeApi: WriteApi | null = null;

/**
 * Initialize InfluxDB connection
 */
export function initializeInfluxDB(): boolean {
  try {
    influxDB = new InfluxDB({
      url: INFLUX_CONFIG.url,
      token: INFLUX_CONFIG.token,
    });

    writeApi = influxDB.getWriteApi(INFLUX_CONFIG.org, INFLUX_CONFIG.bucket);

    console.log('✅ InfluxDB initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize InfluxDB:', error);
    return false;
  }
}

/**
 * Write MQTT sensor data to InfluxDB with wallet address as primary key
 */
export async function writeSensorData(data: {
  deviceId: string;
  deviceType: 'SEQUESTER' | 'EMITTER';
  apiKey?: string;
  walletAddress?: string;
  co2: number;
  humidity: number;
  credits: number;
  emissions: number;
  offset: boolean;
  timestamp: number;
  location?: string;
  ip?: string;
  mac?: string;
  // New format fields
  avgCo2?: number;
  maxCo2?: number;
  minCo2?: number;
  avgHumidity?: number;
  maxHumidity?: number;
  minHumidity?: number;
  samples?: number;
  creditsAvailable?: number;
}): Promise<boolean> {
  if (!writeApi) {
    console.error('❌ InfluxDB not initialized - cannot write sensor data');
    return false;
  }

  // Validate and sanitize numeric fields
  const sanitizedData = {
    ...data,
    co2: typeof data.co2 === 'number' && !isNaN(data.co2) ? data.co2 : 0,
    humidity:
      typeof data.humidity === 'number' && !isNaN(data.humidity)
        ? data.humidity
        : 0,
    credits:
      typeof data.credits === 'number' && !isNaN(data.credits)
        ? data.credits
        : 0,
    emissions:
      typeof data.emissions === 'number' && !isNaN(data.emissions)
        ? data.emissions
        : 0,
    offset: typeof data.offset === 'boolean' ? data.offset : false,
    // New format fields
    avgCo2:
      typeof data.avgCo2 === 'number' && !isNaN(data.avgCo2)
        ? data.avgCo2
        : undefined,
    maxCo2:
      typeof data.maxCo2 === 'number' && !isNaN(data.maxCo2)
        ? data.maxCo2
        : undefined,
    minCo2:
      typeof data.minCo2 === 'number' && !isNaN(data.minCo2)
        ? data.minCo2
        : undefined,
    avgHumidity:
      typeof data.avgHumidity === 'number' && !isNaN(data.avgHumidity)
        ? data.avgHumidity
        : undefined,
    maxHumidity:
      typeof data.maxHumidity === 'number' && !isNaN(data.maxHumidity)
        ? data.maxHumidity
        : undefined,
    minHumidity:
      typeof data.minHumidity === 'number' && !isNaN(data.minHumidity)
        ? data.minHumidity
        : undefined,
    samples:
      typeof data.samples === 'number' && !isNaN(data.samples)
        ? data.samples
        : undefined,
    creditsAvailable:
      typeof data.creditsAvailable === 'number' && !isNaN(data.creditsAvailable)
        ? data.creditsAvailable
        : undefined,
  };

  try {
    // Use wallet address as primary identifier, fallback to device ID
    const primaryKey =
      sanitizedData.walletAddress || sanitizedData.deviceId || 'unknown';

    // Create a data point with wallet address as the primary key
    const point = new Point('sensor_data')
      // Primary key: wallet address (most important for carbon credit tracking)
      .tag('wallet_address', sanitizedData.walletAddress || 'unknown')
      .tag('device_id', sanitizedData.deviceId)
      .tag('device_type', sanitizedData.deviceType)
      .tag('api_key', sanitizedData.apiKey || 'unknown')
      .tag('location', sanitizedData.location || 'unknown')
      .tag('ip', sanitizedData.ip || 'unknown')
      .tag('mac', sanitizedData.mac || 'unknown')
      // Core sensor data fields - using sanitized values
      .floatField('co2', sanitizedData.co2)
      .floatField('humidity', sanitizedData.humidity)
      .floatField('credits', sanitizedData.credits)
      .floatField('emissions', sanitizedData.emissions)
      .booleanField('offset', sanitizedData.offset)
      // New format fields (only add if they exist)
      .timestamp(new Date(sanitizedData.timestamp));

    // Add new format fields only if they exist
    if (sanitizedData.avgCo2 !== undefined)
      point.floatField('avg_co2', sanitizedData.avgCo2);
    if (sanitizedData.maxCo2 !== undefined)
      point.floatField('max_co2', sanitizedData.maxCo2);
    if (sanitizedData.minCo2 !== undefined)
      point.floatField('min_co2', sanitizedData.minCo2);
    if (sanitizedData.avgHumidity !== undefined)
      point.floatField('avg_humidity', sanitizedData.avgHumidity);
    if (sanitizedData.maxHumidity !== undefined)
      point.floatField('max_humidity', sanitizedData.maxHumidity);
    if (sanitizedData.minHumidity !== undefined)
      point.floatField('min_humidity', sanitizedData.minHumidity);
    if (sanitizedData.samples !== undefined)
      point.intField('samples', sanitizedData.samples);
    if (sanitizedData.creditsAvailable !== undefined)
      point.floatField('credits_available', sanitizedData.creditsAvailable);

    // Write the point to InfluxDB
    writeApi.writePoint(point);

    // Flush to ensure data is written immediately
    await writeApi.flush();

    console.log(
      `✅ Sensor data written to InfluxDB with wallet key: ${data.walletAddress ? data.walletAddress.slice(0, 6) + '...' + data.walletAddress.slice(-4) : 'unknown'} (device: ${data.deviceId})`
    );
    return true;
  } catch (error) {
    console.error('❌ Failed to write sensor data to InfluxDB:', error);
    console.error('Data details:', {
      deviceId: data.deviceId,
      walletAddress: data.walletAddress
        ? data.walletAddress.slice(0, 6) + '...' + data.walletAddress.slice(-4)
        : 'unknown',
      deviceType: data.deviceType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Write heartbeat data to InfluxDB
 */
export async function writeHeartbeatData(data: {
  deviceId: string;
  deviceType: 'SEQUESTER' | 'EMITTER';
  apiKey?: string;
  walletAddress?: string;
  status: string;
  uptime: number;
  rssi: number;
  timestamp: number;
  ip?: string;
  mac?: string;
}): Promise<boolean> {
  if (!writeApi) {
    console.error('❌ InfluxDB not initialized - cannot write heartbeat data');
    return false;
  }

  try {
    const point = new Point('device_events')
      .tag('wallet_address', data.walletAddress || 'unknown')
      .tag('device_id', data.deviceId)
      .tag('device_type', data.deviceType)
      .tag('api_key', data.apiKey || 'unknown')
      .tag('event', 'heartbeat')
      .tag('ip', data.ip || 'unknown')
      .tag('mac', data.mac || 'unknown')
      .stringField('status', data.status)
      .intField('uptime', data.uptime)
      .intField('rssi', data.rssi)
      .timestamp(new Date(data.timestamp));

    writeApi.writePoint(point);
    await writeApi.flush();

    console.log(
      `✅ Heartbeat data written to InfluxDB for device: ${data.deviceId}`
    );
    return true;
  } catch (error) {
    console.error('❌ Failed to write heartbeat data to InfluxDB:', error);
    return false;
  }
}

/**
 * Write alert data to InfluxDB
 */
export async function writeAlertData(data: {
  deviceId: string;
  deviceType: 'SEQUESTER' | 'EMITTER';
  apiKey?: string;
  walletAddress?: string;
  alertType: string;
  message: string;
  co2: number;
  credits: number;
  timestamp: number;
  ip?: string;
  mac?: string;
}): Promise<boolean> {
  if (!writeApi) {
    console.error('❌ InfluxDB not initialized - cannot write alert data');
    return false;
  }

  try {
    const point = new Point('device_events')
      .tag('wallet_address', data.walletAddress || 'unknown')
      .tag('device_id', data.deviceId)
      .tag('device_type', data.deviceType)
      .tag('api_key', data.apiKey || 'unknown')
      .tag('event', 'alert')
      .tag('alert_type', data.alertType)
      .tag('ip', data.ip || 'unknown')
      .tag('mac', data.mac || 'unknown')
      .stringField('message', data.message)
      .floatField('co2', data.co2)
      .floatField('credits', data.credits)
      .timestamp(new Date(data.timestamp));

    writeApi.writePoint(point);
    await writeApi.flush();

    console.log(
      `✅ Alert data written to InfluxDB for device: ${data.deviceId}`
    );
    return true;
  } catch (error) {
    console.error('❌ Failed to write alert data to InfluxDB:', error);
    return false;
  }
}

/**
 * Write device connection events to InfluxDB with wallet address as primary key
 */
export async function writeConnectionEvent(data: {
  deviceId: string;
  deviceType: 'SEQUESTER' | 'EMITTER';
  apiKey?: string;
  walletAddress?: string;
  event: 'connected' | 'disconnected' | 'error';
  timestamp: number;
  error?: string;
}): Promise<boolean> {
  if (!writeApi) {
    console.error(
      '❌ InfluxDB not initialized - cannot write connection event'
    );
    return false;
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
      .timestamp(new Date(data.timestamp));

    writeApi.writePoint(point);
    await writeApi.flush();

    console.log(
      `✅ Connection event written to InfluxDB with wallet key: ${data.walletAddress ? data.walletAddress.slice(0, 6) + '...' + data.walletAddress.slice(-4) : 'unknown'} - ${data.event} (device: ${data.deviceId})`
    );
    return true;
  } catch (error) {
    console.error('❌ Failed to write connection event to InfluxDB:', error);
    console.error('Event details:', {
      deviceId: data.deviceId,
      walletAddress: data.walletAddress
        ? data.walletAddress.slice(0, 6) + '...' + data.walletAddress.slice(-4)
        : 'unknown',
      event: data.event,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Close InfluxDB connection
 */
export function closeInfluxDB(): void {
  if (writeApi) {
    writeApi.close();
    writeApi = null;
  }
  influxDB = null;
  console.log('🔌 InfluxDB connection closed');
}

/**
 * Get InfluxDB client for custom queries
 */
export function getInfluxDBClient(): InfluxDB | null {
  return influxDB;
}

export { INFLUX_CONFIG };
