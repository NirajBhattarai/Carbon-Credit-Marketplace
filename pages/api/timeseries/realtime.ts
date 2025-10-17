import { NextApiRequest, NextApiResponse } from 'next';
import { InfluxDB, QueryApi } from '@influxdata/influxdb-client';

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

  const { deviceId, deviceType, walletAddress, limit = '50' } = req.query;

  try {
    // Build Flux query for real-time data (last 5 minutes)
    let fluxQuery = `
      from(bucket: "${INFLUX_CONFIG.bucket}")
        |> range(start: -5m)
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

    // Add limit and sort
    fluxQuery += `
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: ${limit})
    `;

    console.log('🔍 Executing real-time Flux query:', fluxQuery);

    // Execute query
    const data: any[] = [];
    await queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const record = tableMeta.toObject(row);
        data.push(record);
      },
      error(error) {
        console.error('❌ InfluxDB real-time query error:', error);
        throw error;
      },
      complete() {
        console.log(
          `✅ Real-time query completed. Retrieved ${data.length} records`
        );
      },
    });

    res.status(200).json({
      success: true,
      data: data,
      count: data.length,
      timestamp: new Date().toISOString(),
      realtime: true,
      query: {
        deviceId,
        deviceType,
        walletAddress,
        limit,
      },
    });
  } catch (error) {
    console.error('❌ Real-time query error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
