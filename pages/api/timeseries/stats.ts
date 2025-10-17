import { NextApiRequest, NextApiResponse } from 'next';
import { InfluxDB, QueryApi } from '@influxdata/influxdb-client';
import { RedisService } from '../../../lib/redis';

// Rate limiting map to prevent excessive requests
const requestCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per IP

// InfluxDB Configuration
const INFLUX_CONFIG = {
  url: process.env.INFLUXDB_URL || 'http://localhost:8086',
  token: process.env.INFLUXDB_TOKEN || 'carbon-credit-token-123',
  org: process.env.INFLUXDB_ORG || 'carbon-credit-org',
  bucket: process.env.INFLUXDB_BUCKET || 'mqtt-data',
};

const influxDB = new InfluxDB({
  url: INFLUX_CONFIG.url,
  token: INFLUX_CONFIG.token,
});

const queryApi = influxDB.getQueryApi(INFLUX_CONFIG.org);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIP =
    req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const clientData = requestCounts.get(clientIP as string);

  if (clientData) {
    if (now - clientData.lastReset > RATE_LIMIT_WINDOW) {
      // Reset counter
      requestCounts.set(clientIP as string, { count: 1, lastReset: now });
    } else if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
      console.log(`🚫 Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(
          (clientData.lastReset + RATE_LIMIT_WINDOW - now) / 1000
        ),
      });
    } else {
      clientData.count++;
    }
  } else {
    requestCounts.set(clientIP as string, { count: 1, lastReset: now });
  }

  const {
    deviceId,
    deviceType,
    walletAddress,
    startTime,
    endTime,
    period = '24h',
  } = req.query;

  try {
    // Create cache key from query parameters
    const cacheKey = JSON.stringify({
      deviceId,
      deviceType,
      walletAddress,
      startTime,
      endTime,
      period,
      type: 'stats',
    });

    // Try to get from Redis cache first
    const cachedStats = await RedisService.getTimeseriesStats(cacheKey);
    if (cachedStats) {
      console.log('📊 Returning cached statistics data');
      return res.status(200).json({
        success: true,
        stats: cachedStats,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    console.log('📊 Cache miss - Computing statistics from InfluxDB...');

    // Build Flux query for statistics
    const timeRange = startTime
      ? `start: ${startTime}, stop: ${endTime || 'now()'}`
      : `start: -${period}`;

    let fluxQuery = `
      from(bucket: "${INFLUX_CONFIG.bucket}")
        |> range(${timeRange})
        |> filter(fn: (r) => r._measurement == "sensor_data")
    `;

    // Add filters
    if (deviceId) {
      fluxQuery += `|> filter(fn: (r) => r.device_id == "${deviceId}")`;
    }

    if (deviceType) {
      fluxQuery += `|> filter(fn: (r) => r.device_type == "${deviceType}")`;
    }

    if (walletAddress) {
      fluxQuery += `|> filter(fn: (r) => r.wallet_address == "${walletAddress}")`;
    }

    console.log('🔍 Executing Flux query for stats:', fluxQuery);

    // Execute query to get raw data
    const rawData: any[] = [];
    await queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const record = tableMeta.toObject(row);
        rawData.push(record);
      },
      error(error) {
        console.error('❌ InfluxDB stats query error:', error);
        throw error;
      },
      complete() {
        console.log(
          `✅ Stats query completed. Retrieved ${rawData.length} records`
        );
      },
    });

    // Process data to calculate statistics
    const stats = calculateStats(rawData);

    // Cache the results for 10 minutes
    await RedisService.cacheTimeseriesStats(cacheKey, stats);

    res.status(200).json({
      success: true,
      stats: stats,
      cached: false,
      timestamp: new Date().toISOString(),
      query: {
        deviceId,
        deviceType,
        walletAddress,
        startTime,
        endTime,
        period,
      },
    });
  } catch (error) {
    console.error('❌ Statistics query error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

function calculateStats(data: any[]) {
  if (data.length === 0) {
    return {
      totalPoints: 0,
      deviceCount: 0,
      avgCO2: 0,
      avgHumidity: 0,
      totalCredits: 0,
      totalEmissions: 0,
      timeRange: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
    };
  }

  // Group data by field type
  const co2Data = data.filter(d => d._field === 'co2').map(d => d._value);
  const humidityData = data
    .filter(d => d._field === 'humidity')
    .map(d => d._value);
  const creditsData = data
    .filter(d => d._field === 'credits')
    .map(d => d._value);
  const emissionsData = data
    .filter(d => d._field === 'emissions')
    .map(d => d._value);

  // Get unique devices
  const uniqueDevices = new Set(data.map(d => d.device_id).filter(Boolean));

  // Calculate time range
  const timestamps = data.map(d => new Date(d._time).getTime());
  const timeRange = {
    start: new Date(Math.min(...timestamps)).toISOString(),
    end: new Date(Math.max(...timestamps)).toISOString(),
  };

  // Calculate averages
  const avgCO2 =
    co2Data.length > 0
      ? co2Data.reduce((a, b) => a + b, 0) / co2Data.length
      : 0;
  const avgHumidity =
    humidityData.length > 0
      ? humidityData.reduce((a, b) => a + b, 0) / humidityData.length
      : 0;
  const totalCredits =
    creditsData.length > 0 ? creditsData.reduce((a, b) => a + b, 0) : 0;
  const totalEmissions =
    emissionsData.length > 0 ? emissionsData.reduce((a, b) => a + b, 0) : 0;

  return {
    totalPoints: data.length,
    deviceCount: uniqueDevices.size,
    avgCO2: avgCO2,
    avgHumidity: avgHumidity,
    totalCredits: totalCredits,
    totalEmissions: totalEmissions,
    timeRange: timeRange,
  };
}
