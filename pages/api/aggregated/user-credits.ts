import { NextApiRequest, NextApiResponse } from 'next';
import { InfluxDB, QueryApi } from '@influxdata/influxdb-client';
import { RedisService } from '../../../lib/redis';

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

  try {
    // Try to get from Redis cache first
    const cachedData = await RedisService.getAggregatedUserCredits();
    if (cachedData) {
      console.log('📊 Returning cached user credits data');
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    console.log('📊 Cache miss - Querying user credit data from InfluxDB...');

    // Query sensor data to calculate credits for each user
    const fluxQuery = `
      from(bucket: "${INFLUX_CONFIG.bucket}")
        |> range(start: -24h)
        |> filter(fn: (r) => r._measurement == "sensor_data")
        |> filter(fn: (r) => r._field == "co2" or r._field == "credits")
        |> group(columns: ["wallet_address", "device_type", "_field"])
        |> last()
        |> group(columns: ["wallet_address"])
    `;

    const data: any[] = [];

    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row: string[], tableMeta: any) {
          const tableObject = tableMeta.toObject(row);
          data.push(tableObject);
        },
        error(error: Error) {
          console.error('❌ InfluxDB query error:', error);
          reject(error);
        },
        complete() {
          resolve();
        },
      });
    });

    // Process data to calculate user credits
    const userCredits = calculateUserCredits(data);

    // Sort users by total credits earned
    const sortedUsers = Object.values(userCredits).sort(
      (a: any, b: any) => b.totalCredits - a.totalCredits
    );

    const responseData = {
      timestamp: new Date().toISOString(),
      totalUsers: sortedUsers.length,
      totalCreditsGenerated: sortedUsers.reduce(
        (sum: number, user: any) => sum + user.totalCredits,
        0
      ),
      totalCO2Sequestered: sortedUsers.reduce(
        (sum: number, user: any) => sum + user.totalCO2Sequestered,
        0
      ),
      totalCO2Emitted: sortedUsers.reduce(
        (sum: number, user: any) => sum + user.totalCO2Emitted,
        0
      ),
      users: sortedUsers,
      topPerformers: sortedUsers.slice(0, 10), // Top 10 users
      recentActivity: sortedUsers.filter(
        (user: any) => user.lastActivity > Date.now() - 3600000
      ), // Active in last hour
    };

    // Cache the result
    await RedisService.cacheAggregatedUserCredits(responseData);

    return res.status(200).json({
      success: true,
      data: responseData,
      cached: false,
    });
  } catch (error) {
    console.error('Error calculating user credits:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate user credits',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Calculate credits for each user based on CO2 data
 */
function calculateUserCredits(rawData: any[]) {
  const userCredits: { [walletAddress: string]: any } = {};

  rawData.forEach(row => {
    const walletAddress = row.wallet_address;
    const deviceType = row.device_type;
    const field = row._field;
    const value = parseFloat(row._value);
    const timestamp = new Date(row._time);

    if (!userCredits[walletAddress]) {
      userCredits[walletAddress] = {
        walletAddress,
        username: `User_${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        totalCredits: 0,
        totalCO2Sequestered: 0,
        totalCO2Emitted: 0,
        sequesterDevices: 0,
        emitterDevices: 0,
        lastActivity: 0,
        creditHistory: [],
        co2History: [],
      };
    }

    const user = userCredits[walletAddress];
    user.lastActivity = Math.max(user.lastActivity, timestamp.getTime());

    if (field === 'co2') {
      if (deviceType === 'SEQUESTER') {
        user.totalCO2Sequestered += value;
        user.sequesterDevices++;
      } else if (deviceType === 'EMITTER') {
        user.totalCO2Emitted += value;
        user.emitterDevices++;
      }

      user.co2History.push({
        timestamp: timestamp.getTime(),
        co2: value,
        type: deviceType,
      });
    } else if (field === 'credits') {
      // Use credits field directly - this is the main credit calculation
      if (deviceType === 'SEQUESTER') {
        user.totalCredits += value;
        user.creditHistory.push({
          timestamp: timestamp.getTime(),
          credits: value,
          co2: 0,
          type: 'sequester',
        });
      } else if (deviceType === 'EMITTER') {
        // Emitters consume credits, don't earn them
        user.creditHistory.push({
          timestamp: timestamp.getTime(),
          credits: 0,
          co2: 0,
          type: 'emit',
        });
      }
    }
  });

  // Calculate net impact and additional metrics
  Object.values(userCredits).forEach((user: any) => {
    user.netCO2Impact = user.totalCO2Sequestered - user.totalCO2Emitted;
    user.creditsPerHour =
      user.creditHistory.length > 0
        ? user.totalCredits / (user.creditHistory.length / 24)
        : 0;
    user.averageCO2PerDevice =
      user.sequesterDevices + user.emitterDevices > 0
        ? (user.totalCO2Sequestered + user.totalCO2Emitted) /
          (user.sequesterDevices + user.emitterDevices)
        : 0;

    // Sort history by timestamp
    user.creditHistory.sort((a: any, b: any) => a.timestamp - b.timestamp);
    user.co2History.sort((a: any, b: any) => a.timestamp - b.timestamp);
  });

  return userCredits;
}
