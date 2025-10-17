import { NextApiRequest, NextApiResponse } from 'next'
import { InfluxDB, QueryApi } from '@influxdata/influxdb-client'
import { INFLUX_CONFIG } from '@/lib/influxdb'

const influxDB = new InfluxDB({
  url: INFLUX_CONFIG.url,
  token: INFLUX_CONFIG.token,
})

const queryApi = influxDB.getQueryApi(INFLUX_CONFIG.org)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { 
    deviceId, 
    deviceType, 
    walletAddress,
    period = '24h'
  } = req.query

  try {
    // Build Flux query for statistics
    let fluxQuery = `
      from(bucket: "${INFLUX_CONFIG.bucket}")
        |> range(start: -${period})
        |> filter(fn: (r) => r._measurement == "sensor_data")
    `

    // Add filters
    if (deviceId) {
      fluxQuery += `|> filter(fn: (r) => r.device_id == "${deviceId}")`
    }
    
    if (deviceType) {
      fluxQuery += `|> filter(fn: (r) => r.device_type == "${deviceType}")`
    }
    
    if (walletAddress) {
      fluxQuery += `|> filter(fn: (r) => r.wallet_address == "${walletAddress}")`
    }

    // Add aggregation
    fluxQuery += `
      |> group(columns: ["device_id", "device_type", "wallet_address", "_field"])
      |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
      |> group(columns: ["device_id", "device_type", "wallet_address"])
      |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
    `

    console.log('Statistics Flux Query:', fluxQuery)

    const data: any[] = []
    
    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row: string[], tableMeta: any) {
          const tableObject = tableMeta.toObject(row)
          data.push(tableObject)
        },
        error(error: Error) {
          console.error('InfluxDB query error:', error)
          reject(error)
        },
        complete() {
          resolve()
        },
      })
    })

    // Calculate statistics
    const deviceStats = data.reduce((acc: any, row: any) => {
      const key = `${row.device_id}_${row.device_type}_${row.wallet_address}`
      
      if (!acc[key]) {
        acc[key] = {
          deviceId: row.device_id,
          deviceType: row.device_type,
          walletAddress: row.wallet_address,
          apiKey: row.api_key,
          location: row.location,
          stats: {
            co2: { values: [], avg: 0, min: 0, max: 0 },
            humidity: { values: [], avg: 0, min: 0, max: 0 },
            credits: { values: [], avg: 0, min: 0, max: 0 },
            emissions: { values: [], avg: 0, min: 0, max: 0 },
            dataPoints: 0,
            firstSeen: null,
            lastSeen: null
          }
        }
      }
      
      const value = parseFloat(row._value)
      const field = row._field
      const timestamp = new Date(row._time)
      
      if (acc[key].stats[field]) {
        acc[key].stats[field].values.push(value)
      }
      
      if (!acc[key].stats.firstSeen || timestamp < acc[key].stats.firstSeen) {
        acc[key].stats.firstSeen = timestamp
      }
      
      if (!acc[key].stats.lastSeen || timestamp > acc[key].stats.lastSeen) {
        acc[key].stats.lastSeen = timestamp
      }
      
      acc[key].stats.dataPoints++
      
      return acc
    }, {})

    // Calculate averages, min, max for each device
    Object.values(deviceStats).forEach((device: any) => {
      Object.keys(device.stats).forEach(field => {
        if (field === 'dataPoints' || field === 'firstSeen' || field === 'lastSeen') return
        
        const values = device.stats[field].values
        if (values.length > 0) {
          device.stats[field].avg = values.reduce((a: number, b: number) => a + b, 0) / values.length
          device.stats[field].min = Math.min(...values)
          device.stats[field].max = Math.max(...values)
        }
      })
    })

    return res.status(200).json({
      success: true,
      data: Object.values(deviceStats),
      period,
      count: Object.keys(deviceStats).length
    })

  } catch (error) {
    console.error('Error querying device statistics:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to query device statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
