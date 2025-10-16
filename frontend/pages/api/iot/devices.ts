import { NextApiRequest, NextApiResponse } from 'next'
import { db, iotDevices, eq, desc } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  try {
    switch (method) {
      case 'POST':
        return await registerDevice(req, res)
      case 'GET':
        return await getAllDevices(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  } catch (error) {
    console.error('IoT Devices API Error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Register a new IoT device
async function registerDevice(req: NextApiRequest, res: NextApiResponse) {
  const data = req.body

  try {
    // Validate required fields
    if (!data.deviceId || !data.deviceType || !data.location || !data.projectName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: deviceId, deviceType, location, projectName'
      })
    }

    // Check if device already exists
    const existingDevice = await db.query.iotDevices.findFirst({
      where: eq(iotDevices.deviceId, data.deviceId)
    })

    if (existingDevice) {
      return res.status(409).json({
        success: false,
        message: 'Device already registered'
      })
    }

    // Create device
    const device = await db.insert(iotDevices).values({
      deviceId: data.deviceId,
      deviceType: data.deviceType,
      location: data.location,
      projectName: data.projectName,
      description: data.description || '',
      isActive: true,
      lastSeen: new Date(),
    }).returning()

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      device: device[0]
    })
  } catch (error) {
    console.error('Device registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to register device',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Get all devices
async function getAllDevices(req: NextApiRequest, res: NextApiResponse) {
  try {
    const devices = await db.query.iotDevices.findMany({
      orderBy: [desc(iotDevices.createdAt)]
    })

    res.status(200).json({
      success: true,
      devices,
      count: devices.length
    })
  } catch (error) {
    console.error('Get devices error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get devices',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
