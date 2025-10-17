import { NextApiRequest, NextApiResponse } from 'next'
import { db, iotDevices, deviceData, carbonCreditTransactions, eq, desc } from '@/lib/db'
import crypto from 'crypto'

// Types
interface IoTDataPayload {
  deviceId: string
  timestamp: number
  co2Value: number
  energyValue: number
  temperature: number
  humidity: number
  deviceType: 'SEQUESTER' | 'EMITTER'
  location?: string
  projectName?: string
}

interface DeviceRegistrationPayload {
  deviceId: string
  deviceType: 'SEQUESTER' | 'EMITTER'
  location: string
  projectName: string
  description?: string
}

interface ThresholdUpdatePayload {
  co2Threshold: number
  energyThreshold: number
  timeWindow?: number
}

// In-memory storage for device thresholds and accumulated data
const deviceThresholds = new Map<string, {
  co2Threshold: number
  energyThreshold: number
  timeWindow: number
}>()

const deviceAccumulatedData = new Map<string, {
  totalCo2: number
  totalEnergy: number
  dataPointCount: number
  lastReset: number
  thresholdReached: boolean
}>()

// Helper functions
function generateDataHash(data: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
}

function calculateCreditAmount(deviceType: string, accData: any): number {
  if (deviceType === 'SEQUESTER') {
    return Math.floor(accData.totalCo2 / 1000)
  } else if (deviceType === 'EMITTER') {
    return Math.floor(accData.totalCo2 / 1000)
  }
  return 0
}

async function updateAccumulatedData(deviceId: string, co2Value: number, energyValue: number) {
  const threshold = deviceThresholds.get(deviceId)
  if (!threshold) return

  const now = Date.now()
  const timeWindowMs = threshold.timeWindow * 1000

  // Initialize or reset if time window has passed
  if (!deviceAccumulatedData.has(deviceId) || 
      now - deviceAccumulatedData.get(deviceId)!.lastReset > timeWindowMs) {
    
    deviceAccumulatedData.set(deviceId, {
      totalCo2: 0,
      totalEnergy: 0,
      dataPointCount: 0,
      lastReset: now,
      thresholdReached: false,
    })
  }

  const accData = deviceAccumulatedData.get(deviceId)!
  accData.totalCo2 += co2Value
  accData.totalEnergy += energyValue
  accData.dataPointCount++
}

async function checkThresholds(deviceId: string) {
  const threshold = deviceThresholds.get(deviceId)
  const accData = deviceAccumulatedData.get(deviceId)

  if (!threshold || !accData || accData.thresholdReached) return

  const device = await db.query.iotDevices.findFirst({
    where: eq(iotDevices.deviceId, deviceId)
  })

  if (!device) return

  // Check if thresholds are met
  if (accData.totalCo2 >= threshold.co2Threshold && 
      accData.totalEnergy >= threshold.energyThreshold) {
    
    accData.thresholdReached = true

    // Calculate credit amount based on device type
    const creditAmount = calculateCreditAmount(device.deviceType, accData)

    if (creditAmount > 0) {
      await triggerCreditAction(device, creditAmount, accData)
    }

    console.log(`Threshold reached for device ${deviceId}: ${creditAmount} credits`)
  }
}

async function triggerCreditAction(device: any, amount: number, accData: any) {
  try {
    const transactionType = device.deviceType === 'SEQUESTER' ? 'MINT' : 'BURN'
    
    // Create transaction record
    const transaction = await db.insert(carbonCreditTransactions).values({
      deviceId: device.deviceId,
      transactionType,
      amount: amount.toString(),
      status: 'PENDING',
      data: accData,
    }).returning()

    console.log(`${transactionType} transaction created: ${transaction[0].id}`)
    
    // Here you would integrate with your blockchain service
    // For now, we'll just log the action
    console.log(`Would ${transactionType.toLowerCase()} ${amount} credits for device ${device.deviceId}`)
    
  } catch (error) {
    console.error(`Error triggering credit action: ${error}`)
    throw error
  }
}

// API Routes
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  try {
    switch (method) {
      case 'POST':
        if (req.url?.includes('/devices')) {
          return await registerDevice(req, res)
        } else if (req.url?.includes('/data')) {
          return await receiveIoTData(req, res)
        }
        break

      case 'GET':
        if (req.url?.includes('/devices') && req.query.deviceId) {
          return await getDeviceStatus(req, res)
        } else if (req.url?.includes('/devices')) {
          return await getAllDevices(req, res)
        } else if (req.url?.includes('/health')) {
          return await healthCheck(req, res)
        }
        break

      case 'PUT':
        if (req.url?.includes('/thresholds')) {
          return await updateThresholds(req, res)
        } else if (req.url?.includes('/reset')) {
          return await resetDeviceData(req, res)
        }
        break

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT'])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Register a new IoT device
async function registerDevice(req: NextApiRequest, res: NextApiResponse) {
  const data: DeviceRegistrationPayload = req.body

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
      applicationId: 'default-application', // TODO: Get from request context
      deviceType: data.deviceType,
      location: data.location,
      projectName: data.projectName,
      description: data.description || '',
      isActive: true,
      lastSeen: new Date(),
    }).returning()

    // Set default thresholds
    deviceThresholds.set(data.deviceId, {
      co2Threshold: data.deviceType === 'SEQUESTER' ? 1000 : 1000,
      energyThreshold: data.deviceType === 'SEQUESTER' ? 500 : 500,
      timeWindow: 3600, // 1 hour
    })

    deviceAccumulatedData.set(data.deviceId, {
      totalCo2: 0,
      totalEnergy: 0,
      dataPointCount: 0,
      lastReset: Date.now(),
      thresholdReached: false,
    })

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

// Receive IoT data
async function receiveIoTData(req: NextApiRequest, res: NextApiResponse) {
  const data: IoTDataPayload = req.body

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
      timestamp: new Date(data.timestamp),
      co2Value: data.co2Value.toString(),
      energyValue: data.energyValue.toString(),
      temperature: data.temperature.toString(),
      humidity: data.humidity.toString(),
      dataHash: generateDataHash(data),
      verified: false,
    }).returning()

    // Update accumulated data
    await updateAccumulatedData(data.deviceId, data.co2Value, data.energyValue)

    // Check thresholds
    await checkThresholds(data.deviceId)

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

// Get all devices
async function getAllDevices(req: NextApiRequest, res: NextApiResponse) {
  try {
    const devices = await db.query.iotDevices.findMany({
      orderBy: [desc(iotDevices.createdAt)]
    })

    const devicesWithStatus = devices.map(device => {
      const accData = deviceAccumulatedData.get(device.deviceId)
      const threshold = deviceThresholds.get(device.deviceId)
      
      return {
        ...device,
        accumulatedData: accData,
        threshold,
        isThresholdReached: accData?.thresholdReached || false,
      }
    })

    res.status(200).json({
      success: true,
      devices: devicesWithStatus,
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

// Get device status
async function getDeviceStatus(req: NextApiRequest, res: NextApiResponse) {
  const { deviceId } = req.query

  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Device ID is required'
    })
  }

  try {
    const device = await db.query.iotDevices.findFirst({
      where: eq(iotDevices.deviceId, deviceId)
    })

    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Device ${deviceId} not found`
      })
    }

    const recentData = await db.query.deviceData.findMany({
      where: eq(deviceData.deviceId, deviceId),
      orderBy: [desc(deviceData.timestamp)],
      limit: 10,
    })

    const accData = deviceAccumulatedData.get(deviceId)
    const threshold = deviceThresholds.get(deviceId)

    res.status(200).json({
      success: true,
      device,
      recentData,
      accumulatedData: accData,
      threshold,
      isThresholdReached: accData?.thresholdReached || false,
    })
  } catch (error) {
    console.error('Get device status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get device status',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Update device thresholds
async function updateThresholds(req: NextApiRequest, res: NextApiResponse) {
  const { deviceId } = req.query
  const data: ThresholdUpdatePayload = req.body

  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Device ID is required'
    })
  }

  try {
    const currentThreshold = deviceThresholds.get(deviceId)
    if (!currentThreshold) {
      return res.status(404).json({
        success: false,
        message: `Device ${deviceId} not found`
      })
    }

    const updatedThreshold = {
      co2Threshold: data.co2Threshold || currentThreshold.co2Threshold,
      energyThreshold: data.energyThreshold || currentThreshold.energyThreshold,
      timeWindow: data.timeWindow || currentThreshold.timeWindow,
    }

    deviceThresholds.set(deviceId, updatedThreshold)

    res.status(200).json({
      success: true,
      message: 'Thresholds updated successfully',
      threshold: updatedThreshold
    })
  } catch (error) {
    console.error('Update thresholds error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update thresholds',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Reset device data
async function resetDeviceData(req: NextApiRequest, res: NextApiResponse) {
  const { deviceId } = req.query

  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Device ID is required'
    })
  }

  try {
    if (deviceAccumulatedData.has(deviceId)) {
      const accData = deviceAccumulatedData.get(deviceId)!
      accData.totalCo2 = 0
      accData.totalEnergy = 0
      accData.dataPointCount = 0
      accData.lastReset = Date.now()
      accData.thresholdReached = false
    }

    res.status(200).json({
      success: true,
      message: 'Device data reset successfully'
    })
  } catch (error) {
    console.error('Reset device data error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reset device data',
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
      message: 'IoT API service is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      devices: deviceThresholds.size,
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
