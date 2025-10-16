import { NextApiRequest, NextApiResponse } from 'next'
import { db, iotDevices, deviceData, eq } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  try {
    switch (method) {
      case 'POST':
        return await receiveIoTData(req, res)
      case 'GET':
        return await healthCheck(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  } catch (error) {
    console.error('IoT Data API Error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Receive IoT data
async function receiveIoTData(req: NextApiRequest, res: NextApiResponse) {
  const data = req.body

  try {
    // Validate required fields
    if (!data.deviceId || typeof data.co2Value !== 'number' || typeof data.energyValue !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: deviceId, co2Value, energyValue'
      })
    }

    // Check if device exists
    const device = await db.query.iotDevices.findFirst({
      where: eq(iotDevices.deviceId, data.deviceId)
    })

    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Device ${data.deviceId} not found`
      })
    }

    // Store raw data
    const dataPoint = await db.insert(deviceData).values({
      deviceId: data.deviceId,
      timestamp: new Date(data.timestamp || Date.now()),
      co2Value: data.co2Value.toString(),
      energyValue: data.energyValue.toString(),
      temperature: (data.temperature || 25.0).toString(),
      humidity: (data.humidity || 50.0).toString(),
      dataHash: generateDataHash(data),
      verified: false,
    }).returning()

    // Update device last seen
    await db.update(iotDevices)
      .set({ lastSeen: new Date() })
      .where(eq(iotDevices.deviceId, data.deviceId))

    res.status(201).json({
      success: true,
      message: 'Data processed successfully',
      timestamp: new Date().toISOString(),
      dataPointId: dataPoint[0].id
    })
  } catch (error) {
    console.error('Data processing error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Health check
async function healthCheck(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test database connection
    await db.execute('SELECT 1')

    res.status(200).json({
      success: true,
      message: 'IoT Data API service is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Helper function
function generateDataHash(data: any): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
}
