import { NextApiRequest, NextApiResponse } from 'next'
import { InfluxDB, QueryApi } from '@influxdata/influxdb-client'
import { INFLUX_CONFIG } from '@/lib/influxdb'

// Initialize InfluxDB client for queries
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
    startTime, 
    endTime, 
    limit = '100',
    measurement = 'sensor_data'
  } = req.query

  try {
    // Build Flux query
    let fluxQuery = `
      from(bucket: "${INFLUX_CONFIG.bucket}")
        |> range(start: ${startTime || '-24h'}, stop: ${endTime || 'now()'})
        |> filter(fn: (r) => r._measurement == "${measurement}")
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

    // Add limit and sort
    fluxQuery += `
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: ${limit})
    `

    console.log('Flux Query:', fluxQuery)

    // Execute query
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

    // Group data by device and field
    const groupedData = data.reduce((acc: any, row: any) => {
      const key = `${row.device_id}_${row.device_type}_${row.wallet_address}`
      
      if (!acc[key]) {
        acc[key] = {
          deviceId: row.device_id,
          deviceType: row.device_type,
          walletAddress: row.wallet_address,
          apiKey: row.api_key,
          location: row.location,
          ip: row.ip,
          mac: row.mac,
          data: []
        }
      }
      
      acc[key].data.push({
        timestamp: row._time,
        field: row._field,
        value: row._value
      })
      
      return acc
    }, {})

    // Transform data to time-series format
    const timeSeriesData = Object.values(groupedData).map((device: any) => {
      const timeSeries = device.data.reduce((acc: any, point: any) => {
        const timestamp = new Date(point.timestamp).getTime()
        
        if (!acc[timestamp]) {
          acc[timestamp] = { timestamp }
        }
        
        acc[timestamp][point.field] = point.value
        return acc
      }, {})
      
      return {
        ...device,
        timeSeries: Object.values(timeSeries).sort((a: any, b: any) => a.timestamp - b.timestamp)
      }
    })

    return res.status(200).json({
      success: true,
      data: timeSeriesData,
      query: fluxQuery,
      count: data.length
    })

  } catch (error) {
    console.error('Error querying InfluxDB:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to query time-series data',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
